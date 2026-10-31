# 3rd Eye Supply — Medusa v2 storefront + backend

Medusa **v2.21.2** commerce backend and a Next.js 15 storefront for 3rd Eye
Supply, deployed on Michael's Hostinger VPS via the **Hostinger Docker Manager
API** (project `medusa-3es`) — not via SSH.

> **Read this before deploying anything.** The pre-cutover legacy tree
> (`./backend`, the stock `medusa-starter-default`) is **no longer built**.
> `Dockerfile` and `docker-compose.yml` build `apps/backend`. See
> [MIGRATION.md](MIGRATION.md) for the history.

## Layout

| Path | What it is |
|---|---|
| `apps/backend/` | The Medusa app (2.21.2). Oracle AI guide, CJ dropship fulfilment, Resend email, semantic product search, custom admin pages. |
| `apps/storefront/` | Next.js 15 storefront ("3rd Eye Supply" apothecary theme). |
| `services/langgraph-agent-service/` | FastAPI + LangGraph service. **Not integrated** — nothing calls it, and its executor is a stub. |
| `agents/langgraph-agents/` | Python research-agent library. Test-only; no production caller. |
| `workflows/` | n8n workflow exports (inactive) and a Python test double. **No producer wired.** |
| `docs/langgraph-grounding/` | Design and discipline docs. |
| `backend/` | **Legacy** stock starter. Not in the pnpm workspace, not built, kept only for history. |

## Deploy / update

Via the Hostinger API (`developers.hostinger.com`), project `medusa-3es` on VM
`1174724`, source = this repo's default branch. Create with:

```json
{
  "project_name": "medusa-3es",
  "content": "https://github.com/hopehamster/3rd-eye-medusa",
  "environment": "DB_PASSWORD=<strong>\nJWT_SECRET=<strong>\nCOOKIE_SECRET=<strong>"
}
```

Update an existing project with the `update` action after pushing to main.

## Required environment

Compose passes these through; the app reads them.

| Var | Required | Purpose |
|---|---|---|
| `DB_PASSWORD` | yes | Postgres password (also used in `DATABASE_URL`) |
| `JWT_SECRET` | **yes** | Medusa auth JWT secret. There is **no fallback** — the app refuses to start without it. |
| `COOKIE_SECRET` | **yes** | Same, for cookies. |
| `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` | yes | Real origins. Defaults are localhost, not `*`. |

Optional — **a blank key disables that feature; it no longer crashes the boot**:

| Var | Disables when blank |
|---|---|
| `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` | Card payments. Webhook secret is required for 3DS/async or orders stay `pending`. |
| `DEEPSEEK_API_KEY` (`ORACLE_MODEL`, default `deepseek-chat`) | The Oracle AI guide returns 503. |
| `CJ_API_KEY` / `CJ_EMAIL` (`CJ_DRY_RUN`, default `true`) | CJ dropship fulfilment provider. Keep dry-run until a real order is verified. |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email. |
| `VOYAGE_API_KEY` | **Semantic search index.** Without it `/store` renders empty (the homepage still works, so the site looks alive — this is the trap). |
| `TRUST_PROXY` | Set `true` **only** when behind your own reverse proxy, so rate limiting can trust `x-forwarded-for`. |

## After first deploy

1. Watch container logs until `medusa start` is serving.
2. Create the admin user (`medusa user` or the admin invite flow).
3. Create a **publishable API key** and set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
   on the storefront. The storefront cannot call the Store API without it.
4. Seed: `pnpm backend:seed` (base store/region/shipping) then
   `pnpm --filter @dtc/backend run seed:demo` if you want a demo catalogue.
5. Set `VOYAGE_API_KEY` **before** seeding, or the search index will not build.
6. Re-point the shipping options at `cj-fulfillment` (the seed still creates
   `manual_manual` options) before expecting any order to reach CJ.

## Known-open work

Tracked honestly, not aspirational:

- Product "intent" tagging is **not implemented** — nothing writes `intent:*`
  tags, so the Oracle's tag lookup always falls through to vector search.
- There is **no CI**, and `apps/backend` has no tests. `apps/storefront` has no
  test script.
- The n8n fulfilment workflow is inactive and has no producer.
- Offline/demo mode (`NEXT_PUBLIC_STOREFRONT_OFFLINE_MODE`) is **hard-disabled in
  production builds** — it is build-time only, so unsetting it requires a rebuild.
- Account password/email change is not implemented in the storefront.

## Binding rules

- Never `down`/delete the project without a fresh database backup.
- This VPS hosts Michael's other projects (`content-agency`, `openmuse-vps`,
  `open-computer-use`, `codebench`) — this project is isolated; keep it that way.
