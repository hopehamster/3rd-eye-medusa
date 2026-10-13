# Migration branch: dtc-starter

This branch holds the future of this repo — the 3rd Eye Supply monorepo
built on the official Medusa `dtc-starter`.

## Layout

- `apps/backend/` — Medusa v2 backend (the migration target).
  Includes the Oracle module (`src/modules/oracle/`), the CJ fulfillment
  provider (`src/modules/cj-fulfillment/`), and the seed canon
  (`canon/`, 43 docs).
- `apps/storefront/` — Next.js storefront, including the `/oracle` chat page.

## Legacy files on this branch

`backend/`, `Dockerfile`, `docker-compose.yml` at the root belong to the
**old** `medusa-starter-default` deploy, which is still live on `main`.
Ignore them here — at cutover, `main` is replaced with this branch's tree
plus a new root `docker-compose.yml` that builds `apps/backend`.

## Deploy targets (post-migration)

- VPS: builds `apps/backend` via Docker (replaces the current `medusa-3es`
  project source).
- Storefront: `apps/storefront` via Vercel or the VPS.

See `../workspace/goals/3rd-eye-supply-agentic-storefront-rebuild/files/`
for the master plan, Oracle spec, and migration plan.

## Notes for agents working on this branch

- `pnpm-lock.yaml` is not on the branch (too large for the API push that
  created it). Run `pnpm install` to regenerate it before building.
- Three binary images were skipped: `apps/storefront/public/favicon.ico`,
  `apps/storefront/src/app/opengraph-image.jpg`,
  `apps/storefront/src/app/twitter-image.jpg` (starter defaults — replace
  with 3rd Eye Supply branding anyway).
