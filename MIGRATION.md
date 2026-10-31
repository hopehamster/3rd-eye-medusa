# Migration branch: dtc-starter

This branch holds the future of this repo — the 3rd Eye Supply monorepo
built on the official Medusa `dtc-starter`.

## Layout

- `apps/backend/` — Medusa v2 backend (the migration target).
  Includes the Oracle module (`src/modules/oracle/`), the CJ fulfillment
  provider (`src/modules/cj-fulfillment/`), and the seed canon
  (`canon/`, 6 docs — an earlier version of this file claimed 43).
- `apps/storefront/` — Next.js storefront, including the `/oracle` chat page.

## Legacy files on this branch

`backend/` at the root belongs to the **old** `medusa-starter-default`
deploy. It is excluded from the pnpm workspace and is no longer built.

**Cutover done:** the root `Dockerfile` and `docker-compose.yml` now build
`apps/backend` (Node 22, pnpm workspace), not `backend/`. The legacy tree is
kept only for history and can be deleted once the next deploy is verified.
The duplicate `docker-compose.yaml` has been removed — it was a silent decoy
(`docker compose` resolves the `.yml`, so edits to the `.yaml` did nothing).

## Deploy targets (post-migration)

- VPS: builds `apps/backend` via Docker (replaces the current `medusa-3es`
  project source).
- Storefront: `apps/storefront` via Vercel or the VPS.

See `../workspace/goals/3rd-eye-supply-agentic-storefront-rebuild/files/`
for the master plan, Oracle spec, and migration plan.

## Notes for agents working on this branch

- `pnpm-lock.yaml` **is** on the branch (705 KB at the repo root). The
  earlier note claiming it was absent was stale.
- Three binary images were skipped: `apps/storefront/public/favicon.ico`,
  `apps/storefront/src/app/opengraph-image.jpg`,
  `apps/storefront/src/app/twitter-image.jpg` (starter defaults — replace
  with 3rd Eye Supply branding anyway).
