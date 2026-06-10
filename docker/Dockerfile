FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

# Install deps first (cache layer)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/harmonie/package.json ./apps/harmonie/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

# Build
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/harmonie/dist ./dist
COPY docker/server.js ./server.js
ENV PORT=80
EXPOSE 80
CMD ["node", "server.js"]
