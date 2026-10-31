# syntax=docker/dockerfile:1
# 3rd Eye Supply — Medusa v2 backend (production)
# Build context: repo root. The Medusa app lives in ./apps/backend (pnpm workspace).
# The pre-cutover legacy ./backend starter is NOT built here any more.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# ---------- build ----------
FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
RUN pnpm --filter @dtc/backend run build

# ---------- runtime ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# `medusa build` emits a self-contained app in .medusa/server
COPY --from=builder /app/apps/backend/.medusa/server ./
# The Oracle reads brand/canon markdown from ./canon at runtime.
COPY --from=builder /app/apps/backend/canon ./canon

RUN npm install --omit=dev --no-audit --no-fund

EXPOSE 9000
# Migrations are idempotent — safe to run on every start.
CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]