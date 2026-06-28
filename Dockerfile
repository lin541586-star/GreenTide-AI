FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN npm install -g corepack@0.24.1 && corepack enable
WORKDIR /app

# 跳過 Prisma postinstall 自動 generate（等 schema.prisma 就位再手動）
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/core-server/package.json packages/core-server/package.json
COPY packages/core-web/package.json packages/core-web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --no-frozen-lockfile

# 複製全部原始碼
COPY . .

# Prisma client 生成（binary engine，無需 libssl.so）+ 建置
RUN cd packages/core-server && npx prisma generate && cd /app && pnpm build:web && pnpm build:server

EXPOSE 3000
CMD ["pnpm", "start"]
