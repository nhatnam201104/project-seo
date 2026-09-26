# Deploy ProjectSale (1 VPS, Docker Compose)

Stack: Caddy (HTTPS) → frontend (React Router SSR) → backend (Spring Boot) → MySQL 8.4 + Redis 8.8.
Chỉ Caddy mở cổng 80/443; các service còn lại nằm trong mạng nội bộ `internal`.
Giải thích chi tiết cho người mới: `docs/deploy/docker-deployment-guide.html`.

## 1. Chuẩn bị VPS (một lần)

```bash
# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh

# Swap 2GB — bắt buộc với VPS ≤ 2GB RAM
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Firewall: chỉ SSH + HTTP/HTTPS
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

Trỏ bản ghi DNS `A` của tên miền về IP VPS trước khi chạy (Caddy cần nó để xin chứng chỉ).

## 2. Deploy tự động bằng GitHub Actions (khuyến nghị)

Workflow `.github/workflows/deploy.yml`: push lên `main` → build image → đẩy lên GHCR →
SSH vào VPS chạy `deploy/scripts/remote-deploy.sh` (pull, chờ healthy, tự rollback nếu lỗi).
VPS không cần source code, không build gì.

### 2.1. Trên VPS (một lần)

```bash
# User riêng cho deploy, được dùng docker
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy
sudo mkdir -p /opt/projectsale/deploy && sudo chown -R deploy:deploy /opt/projectsale

# Secret chỉ nằm trên VPS, không bao giờ đi qua GitHub
sudo -u deploy nano /opt/projectsale/deploy/.env.prod   # nội dung theo deploy/.env.prod.example
sudo chmod 600 /opt/projectsale/deploy/.env.prod
```

### 2.2. Tạo SSH key cho GitHub (trên máy của bạn)

```bash
ssh-keygen -t ed25519 -N "" -C "github-deploy" -f projectsale_deploy
ssh-copy-id -i projectsale_deploy.pub deploy@<IP_VPS>
ssh-keyscan -p 22 <IP_VPS>          # kết quả dán vào VPS_KNOWN_HOSTS
```

### 2.3. Cấu hình GitHub (Settings → Secrets and variables → Actions)

| Loại | Tên | Giá trị |
| --- | --- | --- |
| Repository variable | `DOMAIN` | `shop.example.com` (dùng lúc build frontend) |
| Environment `production` · secret | `VPS_HOST` | IP hoặc hostname VPS |
| Environment `production` · secret | `VPS_USER` | `deploy` |
| Environment `production` · secret | `VPS_SSH_KEY` | nội dung file `projectsale_deploy` (private key) |
| Environment `production` · secret | `VPS_KNOWN_HOSTS` | output của `ssh-keyscan` |
| Environment `production` · variable | `VPS_PORT` | tuỳ chọn, mặc định `22` |
| Environment `production` · variable | `DEPLOY_PATH` | tuỳ chọn, mặc định `/opt/projectsale` |

Nên bật **Required reviewers** cho environment `production` (duyệt tay trước khi deploy) và
branch protection cho `main` bắt buộc Backend CI + Frontend CI xanh — workflow deploy không chạy lại test.

### 2.4. Dùng hằng ngày

- **Deploy:** merge PR vào `main` (chỉ khi đổi `backend/`, `frontend/`, `deploy/`) hoặc Actions → Deploy Production → Run workflow.
- **Rollback:** Run workflow, nhập `image_tag` của bản cũ (VD `sha-1a2b3c4`, xem trong tab Packages hoặc
  `cat /opt/projectsale/deploy/.env.release.prev` trên VPS).
- Deploy lỗi healthcheck → script tự quay về bản trước và job báo đỏ.
- Lưu ý: Flyway **không** rollback schema. Migration mới nên tương thích ngược với code cũ.

Lệnh tay trên VPS dùng đúng phiên bản đang chạy:

```bash
cd /opt/projectsale
alias dc='docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod --env-file deploy/.env.release'
dc ps && dc logs -f backend
```

## 3. Deploy thủ công (không dùng CI)

Clone repo lên VPS, rồi:

```bash
cp deploy/.env.prod.example deploy/.env.prod
nano deploy/.env.prod        # điền DOMAIN và mọi secret (openssl rand -base64 48)
chmod 600 deploy/.env.prod
```

Mọi lệnh chạy từ thư mục gốc repo:

```bash
alias dc='docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod'

# Build trên VPS 2GB: build tuần tự để tránh hết RAM
dc build backend && dc build frontend
dc up -d
dc ps                         # chờ tất cả "healthy"
dc logs -f backend            # xem Flyway migrate + "Started ProjectSaleApplication"
```

Cập nhật phiên bản khi deploy thủ công:

```bash
git pull
dc build backend && dc build frontend   # hoặc: dc pull
dc up -d                                # chỉ tạo lại container có image thay đổi
docker image prune -f
```

## Sự cố thường gặp

| Triệu chứng                                                                       | Nguyên nhân / cách xử lý                                                                                |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `required variable X is missing a value`                                          | Thiếu biến trong`deploy/.env.prod`.                                                                      |
| Container bị`OOMKilled` (`docker inspect <c> --format '{{.State.OOMKilled}}'`) | Tăng`*_MEM_LIMIT` tương ứng, kiểm tra swap.                                                           |
| Backend restart liên tục                                                          | `dc logs backend`: thường do sai mật khẩu DB/Redis hoặc `JWT_SECRET_BASE64` < 32 byte.              |
| Caddy không cấp được HTTPS                                                     | DNS chưa trỏ đúng IP, hoặc cổng 80/443 bị chặn.                                                      |
| Đổi mật khẩu MySQL trong`.env.prod` không có tác dụng                     | MySQL chỉ đọc biến khi volume còn trống; đổi bằng`ALTER USER` hoặc xoá volume (MẤT DỮ LIỆU). |
| CD: `Host key verification failed`                                                  | `VPS_KNOWN_HOSTS` sai/thiếu, hoặc VPS vừa cài lại: chạy lại `ssh-keyscan` và cập nhật secret. |
| CD: `permission denied ... docker.sock`                                             | User deploy chưa thuộc nhóm `docker`: `sudo usermod -aG docker deploy`.                          |
| CD: `Thiếu /opt/projectsale/deploy/.env.prod`                                       | Tạo file này trên VPS (mục 2.1).                                                               |
| CD: job báo "không healthy", đã quay về phiên bản trước                           | Xem log trong bước "Pull and restart on VPS"; sửa lỗi rồi push lại.                              |
