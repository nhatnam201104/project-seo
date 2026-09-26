# syntax=docker/dockerfile:1.7
# Frontend React Router v7 (SSR, server.js) — image production.
# Build:  docker build --build-arg VITE_SITE_URL=https://example.com -t projectsale/frontend ./frontend

ARG NODE_IMAGE=node:22-bookworm-slim

# ---------- Stage 1: toàn bộ dependency (kể cả dev) để build ----------
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---------- Stage 2: build client + server bundle ----------
FROM deps AS build
# Biến VITE_* được nhúng cứng vào bundle lúc build, KHÔNG đổi được lúc chạy.
ARG VITE_APP_NAME=ProjectSale
ARG VITE_SITE_URL=http://localhost:3000
ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_SITE_URL=${VITE_SITE_URL}
COPY . .
RUN npm run build

# ---------- Stage 3: chỉ dependency production ----------
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 4: runtime ----------
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=192

COPY --chown=node:node package.json server.js ./
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/build ./build
COPY --chown=node:node public ./public

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "require('net').connect(process.env.PORT||3000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

# server.js tự đóng server êm khi nhận SIGTERM.
CMD ["node", "server.js"]
