FROM node:20-bullseye
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

# 安裝 libssl1.1（Prisma native engine 動態連結必備） + ca-certificates
RUN apt-get update \
  && apt-get install -y --no-install-recommends libssl1.1 openssl ca-certificates \
  && ldconfig \
  && rm -rf /var/lib/apt/lists/*

# 確認 libssl.so.1.1 確實存在，否則 build 直接失敗
RUN test -f /usr/lib/x86_64-linux-gnu/libssl.so.1.1 || \
   (echo "ERROR: libssl.so.1.1 NOT FOUND" && find /usr -name "libssl*" && exit 1)

RUN npm install -g corepack@0.24.1 && corepack enable
WORKDIR /app

# 跳過 pnpm install 期間的 Prisma postinstall 自動 generate
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY packages/core-server/package.json packages/core-server/package.json
COPY packages/core-web/package.json packages/core-web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --no-frozen-lockfile

# 複製全部原始碼
COPY . .

# 直接進 packages/core-server 手動 generate（讓 Prisma 讀取正確的 schema.prisma）
RUN cd packages/core-server && npx prisma generate && cd /app && pnpm build:web && pnpm build:server

EXPOSE 3000
CMD ["pnpm", "start"]
