FROM node:20
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN npm install -g corepack@0.24.1 && corepack enable
WORKDIR /app

# 跳過 Prisma postinstall 自動生成，等 schema.prisma 就位後手動 generate
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/core-server/package.json packages/core-server/package.json
COPY packages/core-web/package.json packages/core-web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --no-frozen-lockfile

# 複製全部原始碼（含 schema.prisma，binaryTargets 生效）
COPY . .

# Prisma client 生成 + 建置
RUN pnpm db:generate && pnpm build:web && pnpm build:server

EXPOSE 3000
CMD ["pnpm", "start"]
