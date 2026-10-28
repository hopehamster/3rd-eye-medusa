# Supplier API Pattern — any supplier API through n8n HTTP Request nodes

**Status:** Standard (draft for independent review). Not a deployed workflow, not a verified live integration.
**Parent:** #111. **This issue:** #118. **Companion:** `idempotent-sync-patterns.md` (#119) — read it before building any sync that writes more than once.
**Boundary in one line:** This pattern covers getting supplier data into the store through n8n; it does not cover owning inventory — for 3rd Eye, CJ fulfills and 3rd Eye holds no inventory, so supplier quantity is an availability signal for backorder/digest decisions, not stock 3rd Eye owns.

## Sources and corrections — read this first

Every rule below cites the n8n community thread it came from: topic 308744,
"Can n8n Cloud integrate external supplier APIs with Tray e-commerce API?"
(2026-08-21), in `~/workspace/3rd-eye-supply/n8n-community/topic-308744-supplier-api.json.md`.
The thread is forum advice about Tray, a Brazilian platform, not a verified
3rd Eye integration — three of its claims do **not** transfer verbatim, and
this standard corrects them rather than repeating them:

1. **Tray's token-in-URL auth is Tray-specific.** Tray's token travels as
   `?access_token=` and expires on `date_expiration_access_token`, so n8n's
   OAuth2 credential cannot manage it (post 2, Anshul_Namdev). Do not copy
   that auth shape to other suppliers. For CJ/Medusa, the v1 workflow
   (`workflows/3rd-eye-order-to-fulfilment.json`) uses header auth from
   environment variables — that is the 3rd Eye shape. The transferable
   lesson is only: *when a supplier's auth is non-standard, build a
   dedicated refresher; never assume the OAuth2 credential fits.*
2. **The memory figures are n8n Cloud Starter figures, not universal.**
   "320 MiB RAM" and "n8n itself averages around 180 MiB" (posts 2 and 6)
   describe Cloud Starter. On self-hosted n8n the numbers differ; the
   transferable rule is the *shape* (sub-workflow batches, thin payloads),
   not the numbers.
3. **"Loop Over Items in batches" is not the memory fix.** Post 5 asks
   whether 50–100 items with Loop Over Items is safe; post 6 corrects it:
   Loop Over Items alone does not hand memory back between iterations.
   Batch size is the wrong lever without the sub-workflow shape (Rule 5).

Context note: the v1 workflow's CJ endpoint paths and response shapes carry
explicit TODOs ("map this to the real CJ response shape before activating").
Nothing in this standard verifies those shapes. A builder must verify them
against the supplier's docs before activating — see Rule 8.

## Secrets rule (applies to every example in this document)

Secrets live in environment variables or n8n credentials ONLY. Never in
workflow JSON that gets shared, never in docs, never in Code node literals.
All examples use obviously fake placeholders: `CJ_API_KEY=<env>`,
`CJ_API_BASE=<env>`, `SUPPLIER_API_KEY=<env>`. If an example below shows a
header, the value is always an `$env` reference, never a key.

---

## Rule 1 — No native node needed: the HTTP Request node talks to any REST API

**Rule.** If a supplier exposes a REST API, use the HTTP Request node with
any method (GET, POST, PUT, …). The absence of a native node for that
supplier or store is not a blocker and not a reason to build a custom
integration first.

**WHY — the failure it prevents.** Teams stall waiting for (or paying for)
a native connector while the API they need is plain HTTP. The original
question in the thread was exactly this — three suppliers, no native Tray
node — and the answer is that the generic node is the integration.

**Concrete example.** Supplier XBZ exposes a JSON API, supplier Asia Import
exposes products/stock/variations/images/videos over an API, and the store
exposes its own API. All three legs are HTTP Request nodes; only the URLs,
methods, and auth headers differ.

**Node pattern.**
`Schedule Trigger (or Webhook) → HTTP Request (supplier GET) → … → HTTP Request (store POST/PUT)`.
Set method, URL, and headers explicitly per node; do not hide the method
or URL inside a Code node where the next builder cannot see it.

**Done when.** A builder can point at the workflow and name, for each
HTTP Request node, the method, the base URL source (env var), and the
auth scheme — without opening a Code node.

**Source:** topic 308744, post 2 (Anshul_Namdev): "The HTTP Request node
calls any REST API with any method, so no native Tray node is needed."

## Rule 2 — SOAP suppliers: post the raw XML envelope, parse with the XML node

**Rule.** For a SOAP supplier (SPOT in the thread), POST the XML envelope
as a raw body from the HTTP Request node and run the response through the
XML node. Do not wait for a SOAP node, and do not hand-parse XML with
string operations in a Code node.

**WHY — the failure it prevents.** Treating SOAP as "unsupported" either
kills a supplier leg or produces brittle regex/string parsing that breaks
on the first namespace or whitespace change in the supplier's envelope.

**Concrete example.** SPOT exposes a REST/SOAP API. The stock request is
an XML envelope in the HTTP Request body with `Content-Type: text/xml`
(or whatever SPOT's docs specify); the response goes through the XML node
so downstream nodes work with structured fields, not raw text.

**Node pattern.**
`HTTP Request (POST, raw XML body) → XML node → Code/Set (map fields) → …`
Keep the envelope as a template with only the varying fields
interpolated; keep the full envelope visible in the node, not assembled
across three Code nodes.

**Done when.** A SOAP response reaches the mapping step as parsed fields,
and changing one envelope field means editing one node.

**Source:** topic 308744, post 2 (Anshul_Namdev): "For SPOT's SOAP
endpoint you post the XML envelope as a raw body and run the response
through the XML node."

## Rule 3 — Business rules run BEFORE send, in Code / Set / Switch nodes

**Rule.** Apply every business rule — price calculations, stock limits,
reference transformations, supplier-colour-to-store-colour mapping —
in Code, Set, and Switch nodes *before* any HTTP Request sends data to
the store. Never send raw supplier data and fix it afterwards, and never
bury a business rule inside a send node's body expression where it cannot
be tested in isolation.

**WHY — the failure it prevents.** Raw supplier data in the store means
wrong prices live until someone notices, a colour the store does not sell
appears on a listing, or a supplier reference leaks into a customer-facing
field. Rules applied after send are cleanup; rules applied before send are
prevention. The thread's asker lists exactly these rules (price, stock
limits, reference transforms, colour mapping) as requirements, not
nice-to-haves.

**Concrete example.** Supplier colour "Azul Marinho" must map to store
colour "Navy". Without a mapping step before send, the listing shows
"Azul Marinho", filters break, and a later fix has to rewrite live
listings. With a Switch/Code mapping step before send, an unmapped colour
hits a defined branch (hold for review or fall back to a documented
default) instead of reaching the store.

**Node pattern.**
`HTTP Request (supplier) → Code (price calc + stock limit) → Switch (colour map / hold unknown) → Set (store-shaped payload) → HTTP Request (store)`.
One node per rule family where a rule family can fail independently;
a Switch branch for "unknown mapping" that routes to a review queue,
never silently through.

**Done when.** For each business rule the supplier brief names, the
builder can point at the node that enforces it, state its fallback for
an unmapped value, and show a run where an unmapped value was held
rather than sent.

**Source:** topic 308744, post 1 (Nathalia_Borralho, requirements) and
post 2 (Anshul_Namdev): "the Code, Set and Switch nodes apply the price
rules, stock limits and color mapping before the data goes out."

## Rule 4 — Delta-only updates: compare first, send only what changed

**Rule.** Compare supplier stock/prices against the store's current state
and send an update to the store only when something changed. Never run a
full-catalog rewrite on every sync.

**WHY — the failure it prevents.** The thread names this as the usual
production death (post 8): "a full catalog rewrite every run (token-in-URL
expiry, no delta, images blocking stock updates)." A full rewrite burns
executions and API quota, overwrites manual store edits with supplier
defaults, and turns one supplier glitch into a store-wide incident. A
delta keeps the blast radius at the SKUs that actually moved.

**Concrete example.** A 2,000-SKU supplier feed runs nightly. Only 14 SKUs
changed price or availability. A full rewrite sends 2,000 store writes
(and risks clobbering 1,986 correct listings); a delta sends 14.

**Node pattern.**
`HTTP Request (supplier feed) → Code (diff against store state / delta table) → IF (changed?) → HTTP Request (store update, changed fields only)`.
The delta comparison needs a stored previous state — a Data Table keyed
on SKU/variant (see `idempotent-sync-patterns.md`, Rule 5) — not a
comparison against whatever the last execution happened to hold in
memory. Keep images out of the delta path: images blocking stock updates
is a named failure mode in the thread.

**Done when.** A sync run over an unchanged feed sends zero store writes,
and the run log shows the diff count (changed SKUs) rather than the feed
size.

**Source:** topic 308744, post 5 (Nathalia_Borralho: "only send updates
to Tray when something has changed"), post 8 (BriefFactory: full rewrite
is "the thing that usually dies in production"), post 7
(Michael_Stables: "one delta table").

## Rule 5 — Batches of 50–100 through Execute Sub-workflow, never Loop Over Items alone

**Rule.** Process supplier feeds in batches of 50–100 items, with the
per-batch work inside a sub-workflow called via Execute Sub-workflow.
Loop Over Items alone is NOT a memory strategy.

**WHY — the failure it prevents.** On a small instance, a feed of
thousands of products and variations exhausts memory mid-run and the
whole sync dies — or worse, dies halfway through writes. Post 6 gives the
mechanism: n8n itself takes a large share of a small instance's memory
before any data arrives, and Loop Over Items does not hand memory back
between iterations, so the parent keeps accumulating every product it has
touched. Batch size alone does not fix that; only the sub-workflow
boundary does, because each batch's memory is freed when its
sub-execution finishes.

**Concrete example.** A 3,000-product feed processed in one execution
grows until the run is killed at product ~1,800 — after 1,800 store
writes, with no clean resume point. The same feed in batches of 50–100
via Execute Sub-workflow finishes, because the parent holds only a list
of short per-batch results (e.g. SKUs changed), not every product blob.

**Node pattern.**
`Schedule Trigger → HTTP Request (paged feed) → Loop Over Items (batch) → Execute Sub-workflow (per-batch: rules → delta → store writes) → Code (collect short results: SKUs changed, errors)`.
The sub-workflow returns only a short result (SKUs changed, error list),
never the batch's full payloads. See also Rule 6: pass thin payloads
across the boundary.

**Done when.** A feed larger than one batch completes without the parent
execution's item count growing with the feed size, and a failed batch can
be re-run without re-running the whole feed.

**Source:** topic 308744, post 6 (Anshul_Namdev): "Loop Over Items on
its own does not hand memory back between iterations… Put the per-batch
work in a sub-workflow and have the loop call it with Execute
Sub-workflow, returning only a short result… With that shape 50 to 100 is
comfortable, and without it the batch size is the wrong lever."

## Rule 6 — Pass IDs, URLs, and changed fields — never full product blobs, never downloaded images

**Rule.** Pass IDs, image/video URLs, and changed fields through the
workflow. Do not carry full product blobs between nodes, and do not
download product image/video files into n8n unless a specific store step
forces a file fetch.

**WHY — the failure it prevents.** Full blobs multiply the memory problem
in Rule 5: every node downstream of the fetch holds a copy, and binary
image data dwarfs the JSON it rides with. The thread's asker already
planned to avoid downloading images and use URLs; the answers confirm
that choice and extend it to the whole payload shape.

**Concrete example.** A product with 8 images: passing the blob with 8
downloaded files through 6 nodes costs roughly 8 files × 6 copies of
memory pressure. Passing `{ sku, image_urls: […], changed_fields: {…} }`
costs a few hundred bytes, and the store's product-images endpoint takes
the URLs directly.

**Node pattern.** After the supplier fetch, a Code/Set node immediately
reduces each item to `{ supplier_sku, variant_id, changed_fields, image_urls, video_urls }`
and discards everything else. Downstream nodes work only with that thin
shape. If a store step genuinely requires a file, fetch that one file in
the sub-workflow that needs it, use it, and let the sub-execution free it.

**Done when.** No node downstream of the fetch step holds a full supplier
product record or a binary image, and the workflow's item JSON at the
store-write step contains only IDs, URLs, and changed fields.

**Source:** topic 308744, post 2 (Anshul_Namdev: "send image URLs to
Tray's product images endpoint instead of downloading the files into
n8n"), post 5 (Nathalia_Borralho, URL plan), post 7 (Michael_Stables:
"pass IDs, URLs, and changed fields through the workflow, not full
product blobs").

## Rule 7 — Non-standard auth gets a dedicated token-refresher workflow writing to a Data Table

**Rule.** If a supplier's or store's auth is not a standard OAuth2 flow
the n8n credential can manage (Tray's token-in-URL is the thread's
example), build a small scheduled workflow whose only job is to call the
refresh endpoint and write the fresh token to a Data Table. Every other
workflow reads the token from that table; no workflow refreshes inline,
and no workflow hard-codes a token.

**WHY — the failure it prevents.** Inline refresh logic duplicated across
workflows drifts: one workflow refreshes, another uses a stale token, a
third hard-codes a token that expires mid-run. A single refresher means
one refresh serves every sync and one expiry is visible in one place.
It also stops a 401 in one workflow from cascading into ad-hoc refresh
attempts in every other workflow.

**Concrete example.** Tray's token expires on `date_expiration_access_token`.
A sync workflow that embeds the token works until the expiry date, then
every run 401s at once. A scheduled refresher that refreshes before
expiry and writes to a Data Table keeps every consumer working without
any of them knowing the refresh dance.

**Node pattern (refresher workflow).**
`Schedule Trigger (before expiry) → HTTP Request (refresh endpoint) → Data Table (upsert token row)`.
**Consumer pattern.** `Data Table (read token row) → HTTP Request (with token from table)`.
For 3rd Eye's CJ/Medusa header auth, the same separation applies in
simpler form: credentials/env vars (`CJ_API_KEY=<env>`) are the single
source, read — never copied — by each node. If a future supplier turns
out non-standard, this rule is the pattern to reach for, not inline
refresh code.

**Done when.** Exactly one workflow (or one credential/env source) owns
token freshness, every consumer reads from it, and rotating a token
requires changing one place.

**Source:** topic 308744, post 2 (Anshul_Namdev): "Use a scheduled
workflow that calls Tray's refresh endpoint, writes the new
access_token to a Data table, and point every Tray request at that
table for the token." See also `idempotent-sync-patterns.md`, Rule 8.

## Rule 8 — Start boring: one supplier, one product class, one delta table, 10 SKUs proven

**Rule.** The first version integrates ONE supplier, ONE product class,
ONE delta table, and ONE store update path. Prove it on 10 SKUs — pull
them, upsert by SKU, change stock on 1 variant, confirm the store shows
it — before adding a second supplier, variation paths, or images.
Leave images off the proof run.

**WHY — the failure it prevents.** The ambitious first version (every
supplier, every variation, images, videos, discontinuations) has so many
moving parts that when it fails nobody knows which part failed, and the
"proof" proves nothing. The thread's two most experienced voices converge
on the same boring start, and the diagnostic version of it names exactly
what settles feasibility: a before/after on 10 SKUs, the auth method the
store actually accepts, and whether the instance survives that payload.

**Concrete example.** A team that starts with all three suppliers and
full image import spends a week debugging image downloads, then discovers
the store write itself was mis-shaped — a defect the 10-SKU, no-image
proof would have caught on day one.

**Node pattern.** The proof is a workflow, not a document: the Rule 1–6
shape at minimum size (one supplier fetch → rules → delta → store
upsert), run on a fixed 10-SKU list, with before/after store state
recorded for those SKUs.

**Done when.** All of these are true and recorded: (a) 10 SKUs pulled
from the supplier; (b) upserted by SKU into the store; (c) stock changed
on exactly 1 variant and confirmed visible in the store; (d) the auth
method the store actually accepts is named (header vs token-in-query);
(e) the run's memory/execution outcome is recorded. Until then, no second
supplier and no image path.

**Source:** topic 308744, post 7 (Michael_Stables: "keep the first
version very boring: one supplier, one product class, one delta table,
and one Tray update path"), post 8 (BriefFactory: "pick ONE supplier
and ONE Tray product type. Pull 10 SKUs, upsert by SKU, change stock on
1 variant, confirm Tray shows it. Leave images off that run").

## Rule 9 — Sync per variation, and handle discontinued products explicitly

**Rule.** Synchronise stock/price at the individual variation/colour
level, not just the product level, and give "no longer available" a
defined outcome (disable/hide the listing, or a defined backorder path)
— never silently keep selling a dead variant.

**WHY — the failure it prevents.** A product-level sync that reports
"in stock" while the customer's colour/size variant is gone takes orders
that cannot be fulfilled. Likewise, a variant that disappears from the
supplier feed and is simply skipped stays live in the store forever,
collecting orders for a product that will never ship.

**Concrete example.** A shirt is in stock in Blue/M but out in Red/L.
A product-level sync marks the shirt available; a Red/L order fails at
fulfilment. A variation-level sync marks Red/L unavailable, and the
store stops selling that variant while Blue/M keeps selling.

**Node pattern.**
`Supplier feed (per variation) → Code (variant key = product + colour + size) → delta per variant → store update per variant → IF (variant absent from feed) → defined dead-variant branch (disable / backorder notice / alert)`.
For 3rd Eye's dropship shape, the dead-variant branch must feed the
backorder path in the v1 order-to-fulfilment workflow, not silently
delete history.

**Done when.** A test feed that removes one variant and changes stock on
another produces exactly two store effects (one disable, one stock
change) and no product-level overwrite.

**Source:** topic 308744, post 1 (Nathalia_Borralho: "synchronize stock
for individual product variations/colors" and "handle products or
variations that are no longer available").

## Rule 10 — Run real syncs on the schedule trigger, not from the editor

**Rule.** Real syncs run on the Schedule Trigger with the editor tab
closed. Manual editor runs are for small proofs only (see Rule 8), never
for full feeds.

**WHY — the failure it prevents.** On Cloud, manual editor runs and an
open canvas during a heavy execution both draw on the same memory budget
as the sync itself (post 6). A sync that passes from the editor may still
be the run that dies on schedule — or the reverse: an editor run that
dies may be an editor artefact, not a sync defect, and debugging it
wastes the proof run.

**Concrete example.** A 500-SKU sync tested manually from the editor
OOMs; the team shrinks batches and re-architects, then learns the
scheduled run with the tab closed had headroom all along. Testing the
real shape (scheduled, tab closed) from the start avoids both false
failures and false passes.

**Node pattern.** `Schedule Trigger → …` as the production entry point;
the editor "Execute Workflow" button is not a production path. Record
which trigger a proof run used alongside its result.

**Done when.** The proof in Rule 8 and every full-feed run record their
trigger type, and no full-feed run's verdict rests on an editor run.

**Source:** topic 308744, post 6 (Anshul_Namdev): "running these
manually from the editor costs more than a triggered run, and leaving
the canvas open during a heavy execution adds to it. Do the real syncs
on the schedule trigger with the tab closed." (Cloud-specific; on
self-hosted n8n, treat as a discipline rule, not a measured budget.)

---

## Sizing notes (not rules — check before relying on them)

- **Execution budget.** One commenter flags checking that 2,500
  executions (Starter plan) suffice for the planned sync frequency
  (topic 308744, post 4, kjooleng). This is a plan-tier claim about
  Cloud Starter, not a measured 3rd Eye figure — verify against the
  actual plan and sync schedule before committing to a frequency.
- **Write-lock caution.** The same post flags a possible database
  write-lock issue under frequent stock/price updates. Treat as an
  open question for high-frequency syncs, not a proven constraint:
  if sync frequency rises, the delta rule (Rule 4) and batching
  (Rule 5) are the mitigations, and lock behaviour must be observed,
  not assumed.

## Worked mini-example — one supplier sync, end to end

**Setup (fake values only).** Supplier: "Example Supplier" JSON API.
Store: Medusa. Secrets: `SUPPLIER_API_KEY=<env>`, `MEDUSA_ADMIN_TOKEN=<env>`.
Scope for this example only: one supplier, one product class (t-shirts),
10 SKUs, no images on the proof run.

1. **Schedule Trigger** (every 6 hours, matching the v1 workflow's
   inventory-sync cadence) starts the parent workflow. It does not fetch
   anything itself.
2. **HTTP Request — supplier fetch.** `GET <supplier base>/products?class=t-shirt&limit=100`
   with header `Authorization: Bearer {{ $env.SUPPLIER_API_KEY }}`.
   Returns the 10 SKUs as JSON. No native supplier node is involved
   (Rule 1).
3. **Code — thin + rules.** One Code node reduces each item to
   `{ supplier_sku, variant_key, price, availability }`, applies the
   price calculation (e.g. supplier price × documented markup, rounded
   per the store's price rule), applies the stock limit (e.g. never
   list more than the supplier's available quantity), and maps the
   supplier colour through a lookup to the store colour name. An
   unmapped colour routes to a Switch branch that holds the item for
   review instead of sending it (Rule 3, Rule 6).
4. **Data Table — delta.** The node looks up each variant key in the
   delta table (previous price/availability). Items with no change are
   dropped here. In the example, 9 of 10 SKUs are unchanged and drop
   out; 1 SKU changed price (Rule 4).
5. **Loop Over Items + Execute Sub-workflow.** The changed items are
   batched (here, one batch of 1; at scale, batches of 50–100). The
   sub-workflow receives only `{ sku, variant_key, changed_fields }`
   and performs the store write; it returns `{ sku, status }`. The
   parent never holds the full feed (Rule 5, Rule 6).
6. **HTTP Request — store upsert (inside the sub-workflow).**
   `PUT <medusa base>/admin/products/<id>` (or the store's upsert
   endpoint) with header `x-medusa-access-token: {{ $env.MEDUSA_ADMIN_TOKEN }}`
   and only the changed fields in the body. Upsert key: SKU
   (Medusa server-to-server auth uses x-medusa-access-token; Bearer is
   reserved for JWT sessions — see the fulfilment workflow's F4 gate.)
   (see `idempotent-sync-patterns.md`, Rules 1–2, so a re-run of this
   batch is a no-op, not a duplicate).
7. **Data Table — advance the delta.** Only after the store write
   succeeds does the workflow update the delta table row for that SKU.
   A failed write leaves the old delta row in place, so the next run
   retries that SKU (and only that SKU).
8. **Verify (the Rule 8 proof).** Before the run, record the store state
   for the 10 SKUs. After the run, confirm: 9 SKUs unchanged, 1 SKU
   shows the new price, and the store's auth method used is recorded.
   Then — and only then — add the next supplier or the image path.

**What this example deliberately does not do:** it does not download
images (URLs only, when images are added later), does not rewrite the
full catalog, does not touch inventory 3rd Eye does not own, and does
not use a token-in-URL auth shape. Any builder who needs one of those
must justify it against the rule that excludes it, in review — not by
editing this standard silently.

## What this standard does not cover

- The exact CJ/Medusa endpoint paths and response shapes (v1 workflow
  TODOs; verify against supplier docs before activating).
- Store-side pricing/markup values (business decision, not a pattern).
- Workflow JSON templates (follow-up work: templates should encode
  Rules 1–8, not restate them).
- Any claim about live behaviour: this standard is derived from
  community evidence and the v1 workflow file, not from a traced live
  execution. See "could not verify" in the delivery report.
