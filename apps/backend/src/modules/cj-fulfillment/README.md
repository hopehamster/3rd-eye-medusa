# CJ fulfillment provider

Auto-places dropship orders with the supplier when a fulfillment is created
in Medusa. Shoppers only ever see generic option names ("Standard Shipping",
"Express Shipping") — the supplier is never named.

## Setup

1. Env vars (see `apps/backend/.env.template`):
   - `CJ_API_KEY`, `CJ_EMAIL` — from the CJ account API page
   - `CJ_DRY_RUN=true` (default) — logs the order payload instead of calling CJ.
     Set to `false` only after verifying a real order end-to-end.
2. Tag every variant's metadata with its CJ variant id:
   `metadata: { cj_vid: "<CJ variant id>" }`
   The catalog sync sets this; untagged variants fail fulfillment loudly.
3. In admin: create a shipping option using this provider's options
   (`cj-standard` / `cj-express`), flat-rate pricing.

## How it works

- `createFulfillment` resolves `cj_vid` per line item via remote query
  (fulfillment item → order line item → product variant metadata),
  builds the CJ order from the shipping address, and calls
  `POST /shopping/order/createOrder`. The CJ order id is stored on the
  fulfillment's `data`.
- `getFulfillmentDocuments` pulls the tracking number from CJ for the admin UI.
- `cancelFulfillment` cannot cancel via CJ's API — it logs a warning so ops
  cancels in the CJ dashboard instead of assuming success.

## Still to build (Phase 4)

- Tracking sync job: poll CJ for new tracking numbers, update fulfillments.
- CJ catalog sync: import products, set `cj_vid` metadata + intent tags,
  keep prices/stock fresh. Lives outside this module.
