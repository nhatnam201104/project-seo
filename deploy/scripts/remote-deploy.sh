#!/usr/bin/env bash
# Chạy trên VPS, được gọi bởi .github/workflows/deploy.yml qua SSH.
#
# Env bắt buộc:
#   REGISTRY   tiền tố image, VD ghcr.io/nhatnam201104/projectsale
#   TAG        tag image cần deploy, VD sha-1a2b3c4
#   GHCR_USER  user đăng nhập registry
# Token đăng nhập registry đọc từ stdin (không truyền qua tham số để khỏi lộ trong `ps`).
#
# Kết quả: deploy/.env.release ghi phiên bản đang chạy, .env.release.prev giữ phiên bản trước.
# Nếu phiên bản mới không healthy, script tự quay về phiên bản trước rồi báo lỗi.
set -euo pipefail

: "${REGISTRY:?REGISTRY is required}"
: "${TAG:?TAG is required}"
: "${GHCR_USER:?GHCR_USER is required}"

# Compose ưu tiên biến môi trường của shell hơn --env-file. Nếu giữ REGISTRY/TAG trong env,
# lệnh rollback bên dưới vẫn dùng tag mới (hỏng) thay vì tag trong .env.release.
release_registry="$REGISTRY"
release_tag="$TAG"
unset REGISTRY TAG

WAIT_TIMEOUT="${WAIT_TIMEOUT:-300}"
DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DEPLOY_DIR"

if [[ ! -f .env.prod ]]; then
  echo "[deploy] Thiếu $DEPLOY_DIR/.env.prod — tạo từ .env.prod.example trước." >&2
  exit 1
fi

compose() {
  local release_file="$1"
  shift
  docker compose -f docker-compose.prod.yml --env-file .env.prod --env-file "$release_file" "$@"
}

IFS= read -r registry_token
registry_host="${release_registry%%/*}"
printf '%s\n' "$registry_token" | docker login "$registry_host" -u "$GHCR_USER" --password-stdin
# Luôn logout registry và xoá file tạm, kể cả khi lỗi giữa chừng.
trap 'rm -f .env.release.next; docker logout "$registry_host" >/dev/null 2>&1 || true' EXIT

printf 'REGISTRY=%s\nTAG=%s\n' "$release_registry" "$release_tag" > .env.release.next

echo "[deploy] Pull $release_registry/{backend,frontend}:$release_tag"
compose .env.release.next pull --quiet

echo "[deploy] Khởi động, chờ healthy tối đa ${WAIT_TIMEOUT}s"
if ! compose .env.release.next up -d --no-build --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT"; then
  echo "[deploy] Phiên bản $release_tag không healthy. Log backend/frontend gần nhất:" >&2
  compose .env.release.next logs --tail 80 backend frontend >&2 || true
  if [[ -f .env.release ]]; then
    echo "[deploy] Quay về phiên bản trước: $(grep '^TAG=' .env.release)" >&2
    if compose .env.release up -d --no-build --remove-orphans --wait --wait-timeout "$WAIT_TIMEOUT" >&2; then
      echo "[deploy] Đã quay về phiên bản trước, hệ thống vẫn phục vụ bình thường." >&2
    else
      echo "[deploy] ROLLBACK CŨNG THẤT BẠI — cần xử lý tay trên VPS." >&2
    fi
  else
    echo "[deploy] Không có phiên bản trước để quay về (lần deploy đầu tiên)." >&2
  fi
  exit 1
fi

# Caddyfile có thể đã đổi; reload không làm rớt kết nối.
compose .env.release.next exec -T caddy caddy reload --config /etc/caddy/Caddyfile

if [[ -f .env.release ]]; then
  mv .env.release .env.release.prev
fi
mv .env.release.next .env.release

# Dọn image không còn container nào dùng và cũ hơn 7 ngày (MySQL/Redis đang chạy nên không bị xoá).
docker image prune -af --filter "until=168h" >/dev/null

echo "[deploy] Xong: $release_registry/*:$release_tag"
compose .env.release ps
