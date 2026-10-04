# 3rd Eye Supply — Medusa Backend

Medusa v2 (2.18.0) commerce backend for 3rd Eye Supply. Deployed on Michael's
Hostinger VPS via the **Hostinger Docker Manager API** (project `medusa-3es`) —
not via SSH.

## Layout

- `docker-compose.yml` — the stack (must stay at repo root; the Docker Manager
  resolves it from the default branch): `medusa` + `postgres:16` + `redis:7`,
  isolated `medusa-3es` network and volumes. Medusa binds `127.0.0.1:9000`
  (internal only).
- `Dockerfile` — multi-stage production build (deps → build → runner).
  Runs `medusa db:migrate` on every start (idempotent), then `medusa start`.
- `backend/` — the Medusa project (from `medusajs/medusa-starter-default`).

## Deploy / update

Via Hostinger API (`developers.hostinger.com`), project `medusa-3es` on VM
`1174724`, source = this repo's default branch URL. Create:

```json
{
  "project_name": "medusa-3es",
  "content": "https://github.com/hopehamster/3rd-eye-medusa",
  "environment": "DB_PASSWORD=<strong>\nJWT_SECRET=<strong>\nCOOKIE_SECRET=<strong>\nSTORE_CORS=*\nADMIN_CORS=*\nAUTH_CORS=*"
}
```

Update an existing project with the `update` action after pushing to main.

## Required environment

| Var | Purpose |
|---|---|
| `DB_PASSWORD` | Postgres password (also used in `DATABASE_URL`) |
| `JWT_SECRET` | Medusa auth JWT secret |
| `COOKIE_SECRET` | Medusa cookie secret |
| `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` | CORS origins (`*` for now; tighten later) |

## After first deploy

1. Check container logs via the Docker Manager API until `medusa start` is serving.
2. Create the admin user (via `medusa user` or the admin invite flow).
3. Import the catalog (`3rd-eye-supply-command-center`, PR #17:
   `09_Agentic_Rebuild/catalog/medusa-products.json`).
4. Stripe plugin (`@medusajs/payment-stripe`) is intentionally **not** wired yet —
   add it once the Stripe secret key is available.

## Binding rules

- Never `down`/delete the project without a fresh database backup.
- This VPS hosts Michael's other projects (`content-agency`, `openmuse-vps`,
  `open-computer-use`, `codebench`) — this project is isolated; keep it that way.
