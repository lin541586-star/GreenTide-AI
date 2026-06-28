# ---- 建置階段 ----
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@0.24.1 && corepack enable
WORKDIR /app

# 先複製鎖定檔，充分利用 Docker 層級快取
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/core-server/package.json packages/core-server/package.json
COPY packages/core-web/package.json packages/core-web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --no-frozen-lockfile

# 複製所有原始碼
COPY . .

# Prisma client + 建置
RUN pnpm db:generate && pnpm build:web && pnpm build:server

# ---- 執行階段 ----
FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN npm install -g corepack@0.24.1 && corepack enable
WORKDIR /app

# 只複製建置結果與執行時期需要的檔案
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/core-server/dist ./packages/core-server/dist
COPY --from=builder /app/packages/core-server/prisma ./packages/core-server/prisma
COPY --from=builder /app/packages/core-server/package.json ./packages/core-server/package.json
COPY --from=builder /app/packages/core-web/dist ./packages/core-web/dist
COPY --from=builder /app/packages/core-web/package.json ./packages/core-web/package.json
COPY --from=builder /app/packages/shared-types ./packages/shared-types
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/.npmrc ./.npmrc

EXPOSE 3000
CMD ["pnpm", "start"]
