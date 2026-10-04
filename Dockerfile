# 3rd Eye Supply — Medusa v2 backend (production)
# Build context: repo root. The Medusa project lives in ./backend/
FROM node:20-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app/backend
COPY backend/package.json ./
# No yarn.lock shipped (exceeds push API limits) — yarn resolves fresh and
# writes its own lockfile in the image. Medusa deps are pinned in package.json.
RUN yarn install

FROM base AS builder
WORKDIR /app/backend
COPY --from=deps /app/backend/node_modules ./node_modules
COPY backend/ ./
RUN yarn build

FROM base AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/.medusa ./.medusa
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/backend/src ./src
EXPOSE 9000
# Migrations are idempotent — safe to run on every start
CMD ["sh", "-c", "yarn medusa db:migrate && yarn medusa start"]
