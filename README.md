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

## Intent tagging (the Oracle's product matching)

Intents are the join between a shopper's need and the catalogue. There is
**one canonical channel**: the `metadata.intents` array on a product, holding
1-3 ids from `apps/backend/src/modules/oracle/taxonomy.ts`.

Everything reads that same array:

| Consumer | Where |
|---|---|
| Search index (facet + Oracle lookup) | `apps/backend/src/search/product.ts` |
| Storefront refinement facet | `modules/store/components/store-refinements` |
| Intention shelves | `modules/store/data/shelves.ts` |
| PDP intent chips | `modules/products/templates/product-info` |
| Ritual builder | `modules/ritual/components/ritual-builder` |

> History worth knowing: the Oracle used to query `intent:<id>` product **tags**.
> Nothing in the repo ever wrote those tags, so the tag query matched zero
> products every time and the Oracle silently fell back to vector search for
> 100% of consultations. There is no tag channel any more — do not reintroduce
> one.

**To tag products:** Admin → AI Content generates suggested intents from the
title/description; a human reviews and applies. Applying writes
`metadata.intents` and the search index picks it up on the next product event.

**To check coverage:**

```bash
pnpm --filter @dtc/backend run audit:intents
```

It is read-only. It prints how many published products carry intents, which
products carry none, which carry ids outside the taxonomy (silently dropped by
every consumer), and which intents have zero products. An intent with zero
products means the Oracle can never pick for that need.

## Known-open work

Tracked honestly, not aspirational:

- The catalogue is **not intent-tagged**. The plumbing is now correct (see
  below) but every published product needs `metadata.intents` before the
  Oracle can match by intent; run `pnpm --filter @dtc/backend run audit:intents`
  to see the gap.
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
