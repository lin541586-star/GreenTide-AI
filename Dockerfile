FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

# Prisma 需要 OpenSSL（slim 不含）
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install -g corepack@0.24.1 && corepack enable
WORKDIR /app

# 複製鎖定檔先裝依賴（跳過 Prisma 自動生成，等 schema 就位再手動 generate）
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/core-server/package.json packages/core-server/package.json
COPY packages/core-web/package.json packages/core-web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --no-frozen-lockfile

# 複製全部原始碼（含 schema.prisma 的 binaryTargets）
COPY . .

# Prisma client 生成 + 建置（此階段 schema 已就位，binaryTargets 生效）
RUN pnpm db:generate && pnpm build:web && pnpm build:server

EXPOSE 3000
CMD ["pnpm", "start"]
