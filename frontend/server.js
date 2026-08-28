/**
 * Production server — thay cho `react-router-serve`, giữ nguyên hành vi của nó
 * (nén, static assets, log, tắt êm) và bổ sung một điều nó không làm được:
 * đưa IP của trình duyệt vào `context.clientIp` cho loader/action.
 *
 * Mọi request tới API đi từ server này, nên backend chỉ thấy IP của nó. Loader
 * chuyển tiếp `clientIp` (kèm INTERNAL_PROXY_SECRET) để rate limit của backend
 * tính theo từng người dùng thay vì gộp tất cả làm một.
 *
 * Env:
 *   PORT             cổng lắng nghe (mặc định 3000)
 *   HOST             địa chỉ bind (tuỳ chọn)
 *   TRUST_PROXY_HOPS số reverse proxy đứng trước Node (nginx/LB = 1). Mặc định 0:
 *                    lấy IP của kết nối và bỏ qua X-Forwarded-For do client tự gửi.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";

const BUILD_PATH = path.resolve("build/server/index.js");

function parseTrustProxyHops(value) {
  if (value === undefined || value === "") return 0;
  const hops = Number(value);
  if (!Number.isInteger(hops) || hops < 0) {
    throw new Error(`TRUST_PROXY_HOPS must be a non-negative integer, got "${value}"`);
  }
  return hops;
}

const port = Number(process.env.PORT) || 3000;
const trustProxyHops = parseTrustProxyHops(process.env.TRUST_PROXY_HOPS);
const build = await import(pathToFileURL(BUILD_PATH).href);

const app = express();
app.disable("x-powered-by");
// Chỉ tin đúng số hop đã khai báo: đặt cao hơn thực tế sẽ cho client tự chọn IP của mình.
app.set("trust proxy", trustProxyHops);
app.use(compression());
app.use(
  path.posix.join(build.publicPath, "assets"),
  express.static(path.join(build.assetsBuildDirectory, "assets"), {
    immutable: true,
    maxAge: "1y",
  }),
);
app.use(build.publicPath, express.static(build.assetsBuildDirectory));
app.use(express.static("public", { maxAge: "1h" }));
app.use(morgan("tiny"));
app.all(
  "*",
  createRequestHandler({
    build,
    mode: process.env.NODE_ENV,
    getLoadContext: (req) => ({ clientIp: req.ip }),
  }),
);

const onListen = () => console.info(`[server] http://localhost:${port}`);
const server = process.env.HOST
  ? app.listen(port, process.env.HOST, onListen)
  : app.listen(port, onListen);

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => server.close(console.error));
}
