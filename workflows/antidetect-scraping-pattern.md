# Antidetect-browser scraping pattern (LAST-resort supplier fallback)

> Status: pattern doc + config templates only. No n8n workflow is built here,
> no supplier site was scraped to produce this doc, and nothing here is
> live, deployed, or proven. A separate builder + reviewer + live check own
> any real implementation.
>
> Boundary in one line: this doc tells a future builder when scraping is
> allowed and how to shape it; it does not authorize any scrape by itself.
>
> Dropship filter: CJ fulfills, no inventory held. Scraped supplier data is
> a listing/price/availability *signal* to verify before it reaches the
> storefront — never stock we claim to hold.

## 0. Adversarial verdict (why this pattern is narrow)

Antidetect scraping is not a neutral fallback. It is fragile (fingerprint
arms-race, blocks, account bans), ToS-risky, and its upkeep can exceed a
manual import. The community evidence behind it is thin: the antidetect
thread is a trend post plus one queue tip, not a proven implementation
(see §7). So this pattern treats scraping as a LAST, gated, narrow
exception — not a standard sourcing route. If the gate in §1 fails, do not
scrape; take the higher-rung alternative instead.

## 1. When scraping is justified — the decision ladder

Work the ladder top-down. Document which rung was tried and why it failed
before moving down. Scraping is the last rung, never the first.

| Rung | Route | Move down only when |
|------|-------|---------------------|
| 1 | Supplier API | No API exists, or it does not expose the needed fields |
| 2 | Supplier feed (CSV/XML/JSON feed, or a feed the supplier provides on request) | No feed, or the feed is stale/broken after asking |
| 3 | CSV / manual import (supplier spreadsheet, manual entry for a small catalog) | Volume or update frequency genuinely exceeds manual handling |
| 4 | A different supplier for the same product | No equivalent supplier carries it |
| 5 | **Scraping (this pattern)** | All of the above exhausted AND §1.1 passes |

### 1.1 The gate — ALL must be true before any scrape

**Approver (named role, applies to every approval in this pattern).**
The approver is the project owner (Michael) — not the operator, not the
builder, not a general "human". No approval in this pattern is valid
unless it names that approver, and no approval may be delegated to the
person running the scrape. This preserves the security reviewer's
assessment that the ethics/ToS gate is enforceable as process (checklist
+ STOP + human escalation) while removing its weakest point: an unnamed
approver could previously approve proceeding despite a flagged item.
Under the fixed gate below, that override no longer reaches an explicit
ban at all (F1).

1. The supplier is the sole source of a proven winner (not a speculative
   product — scraping effort is only spent where demand is already shown).
   "Proven winner" and "sole source" are not left to builder judgement
   (F5): the approver records, before any run, (a) the sales evidence
   for this product (orders and/or revenue, with the period covered),
   (b) the threshold they applied to call it proven, and (c) the date;
   "sole source" is shown by the decision-ladder record in §1 (rungs 1–4
   tried, with dates and outcomes, and no equivalent supplier found).
   No sales evidence and no threshold on record = gate not passed.
2. The data is public listing data (title, price, availability, public
   listing URL). No login-walled, account, or private data.
3. The robots/ToS check (see `robots-tos-check-checklist.md`) passes
   under the HARD STOP rule:
   - **Explicit ban = HARD STOP, no override.** If the supplier's ToS
     explicitly bans bots/automated access/scraping, OR robots.txt
     disallows the paths to be scraped, the supplier (or those paths)
     is STOPPED. No human approval — including the project owner's —
     may override an explicit ban under this pattern. The only routes
     left are rungs 1–4 (API, feed, manual import, different supplier).
   - **Silent/ambiguous ToS only = narrow override.** Only where the
     ToS is silent on automated access, or its wording is genuinely
     ambiguous (quoted in the checklist, ambiguity stated, not assumed),
     may the approver approve proceeding — and only with a record made
     BEFORE any run containing: approver name, date, reasoning, and
     scope (supplier, data set, and approved SKU set). An approval
     without all four fields is not an approval. The stricter reading
     wins on any conflict: one explicit ban anywhere stops the run
     even if another document is silent.
4. The approver approved this supplier + this data set specifically. A
   general "scraping is OK" approval does not cover a new supplier, a
   new data set, or a new SKU set.
5. The run is rate-limited and delta-only (§5): it reads what changed, it
   does not bulk-copy a catalog on every run. The single exception is
   the first-run baseline (F4, §5): one baseline read, limited to the
   approved SKU set, recorded as such — never a whole catalog.

### 1.2 When scraping is NOT justified — stop, do not work around it

- Data behind a login, checkout, or account wall.
- The supplier explicitly bans bots/automated access — HARD STOP, no
  approval can override it (§1.1(3)). A block is a stop signal, not a
  puzzle (see §6).
- Bulk copying a whole catalog when only a few SKUs matter.
- Evading a ban: if a profile, IP, or account was banned for this purpose,
  rotating to a fresh identity to continue the same scrape is evasion, not
  a retry. Escalate instead (§6).
- Any case where rung 1–4 has not actually been tried. "No API" must mean
  checked, not assumed — ask the supplier for a feed first; a "no" in
  writing is evidence, a guess is not.

## 2. Tool choice — antidetect browser profiles

Source: n8n community topic-122967 (Vincatle, 2025-05-29).

- **Use an antidetect browser** (examples named in the community thread:
  Hidemium, GoLogin, Incogniton) when a real browser is genuinely needed —
  i.e. the data is behind dynamic JS rendering that a plain HTTP request
  cannot return. If a plain HTTP request returns the data, do not add a
  browser: the browser is extra surface, extra cost, extra breakage.
  [Source: topic-122967 — "Scraping data that's hidden behind logins or
  dynamic JS" as a use case; "APIs are restrictive: rate limits, captcha
  walls, and platform bans are getting worse" as the stated motive.]
- **One isolated profile per supplier, never shared across suppliers.**
  Each profile carries its own unique fingerprint, cookies, and proxy
  assignment, so a problem with one supplier cannot contaminate another.
  [Source: topic-122967 — "isolated browser profiles with unique
  fingerprints"; "storing login cookies and rotating proxies".]
  **Cookie limit (F6):** profile cookies must NEVER include
  authenticated session cookies for the scraped supplier — no login
  session is stored, reused, or refreshed in a profile, because that
  would reintroduce login-walled access through the back door (§1.2).
  A profile found to contain an authenticated session cookie is retired
  and the event is escalated to the approver. The community thread's
  "storing login cookies" use case is NOT adopted for supplier work.
- **Drive the browser from n8n via its API or CLI**, not by hand.
  [Source: topic-122967 — "Integrating browser commands into n8n flows
  via API or CLI"; "Schedule runs, listen for events, manage webhooks,
  store cookies — all without heavy dev overhead".]
- **Do not use the multi-account / engagement tricks from the same thread
  for supplier work.** The thread's other use cases (warming social
  accounts, simulating likes/follows/comments across accounts) are NOT
  part of this pattern and must not be copied into a supplier workflow.
  [Source: topic-122967 — use cases listed; excluded here by design.]
- **Selection note (unverified):** the community thread names tools but
  gives no head-to-head comparison, pricing, or reliability data. Tool
  selection (which antidetect browser, which plan) is an open decision for
  the implementing builder, to be recorded with reasons — not something
  this doc can settle from the thread alone.

## 3. Anti-bot measures — pre-block posture only, and an approved risk

Source: n8n community topic-176926 (Vincent Chan's 1688 anti-bot problem;
Thelma Robinson's reply, 2026-05-16).

**Honest reframe (F3).** The previous version of this section claimed
these measures merely "reduce accidental bot-shaped traffic" and are not
evasion. That claim is dropped: rotating residential proxies and
antidetect fingerprints are detection-evasion-capable measures, not
neutral politeness. Their use is therefore an approved per-supplier
risk, not a default: the approver records, before any run, that the
§3 measures below are authorized for this supplier, with reasoning and
scope (supplier, SKU set, profile), alongside the §1.1 record. If that
risk record does not exist, §3 measures are not authorized for that
supplier.

- **Rotating residential proxies.** Rotate the egress IP across requests
  so traffic does not arrive as a single hammering source.
  [Source: topic-176926 reply — "try rotating residential proxies".]
- **Random delays between requests.** Fixed-interval polling is the most
  machine-shaped signal there is; jitter the delay so request timing is
  irregular. Do not tune delays to "just under the rate limit" — that is
  still hammering, only polite-looking.
  [Source: topic-176926 reply — "adding random delays".]
- **Real browser headers on HTTP requests.** Where a plain HTTP request
  suffices (rung-5 work that does not need JS rendering), send the headers
  a real browser would send, via n8n's HTTP Request node.
  [Source: topic-176926 reply — "n8n's HTTP Request node with
  browser-headers helps".]

**The enforceable line (F3) — permitted ONLY before a block, FORBIDDEN
after one.** The test a builder or reviewer applies is temporal, not
intentional — no judgement call about whether a measure "feels like"
evasion:

| §3 measure | Before any block event for this supplier | After a block event for this supplier |
|------------|------------------------------------------|----------------------------------------|
| Rotating residential proxies | Permitted, only if the per-supplier risk record above exists | FORBIDDEN for resuming the paused scrape — no fresh IP to continue the same scrape |
| Antidetect fingerprints / isolated profiles | Permitted, only if the risk record exists | FORBIDDEN for resuming the paused scrape — no fresh profile/fingerprint to continue the same scrape; the blocked profile is frozen, not rotated away from |
| Real browser headers | Permitted, only if the risk record exists | FORBIDDEN as a resume mechanism for the paused scrape |
| Random delays | Permitted as rate politeness (not a resume mechanism) | Do not re-tune delays to slip past the block; the queue stays paused |

A "block event" means any of: HTTP 403/block page, CAPTCHA challenge,
IP/profile ban, or login wall appearing on a previously public page.
After a block event, that supplier's queue is paused (§6), the affected
items go to dead-letter, and §3 measures do NOT become permitted again
by operator decision. The only way back is a fresh full gate pass
(§1.1 + re-check per F7) with a NEW approver record that names the block
cause, what changed, and why resumption is not evasion of the ban —
and rotating to a fresh identity to dodge the ban is never an authorized
reason. What this does NOT license: §3 measures never make an otherwise
banned scrape allowed (§1.1(3) HARD STOP still applies), and never
defeat an explicit control that has already fired.
- **Honest limit.** The 1688 example in topic-176926 is an unsolved
  problem report ("Scraping 1688 reliably without triggering anti-bot
  systems" is listed as a challenge) answered by one reply's advice. This
  pattern does not claim these three measures reliably beat 1688 or any
  other named anti-bot system. They are the starting posture, not a
  guarantee — which is why §6 (stop on block) and §4 (queue + retry
  limits) exist.

## 4. Queue-based retry / failure logic in n8n

Source: n8n community topic-122967 (Jue, 2025-05-30).

- **Queue, don't blast.** Put scrape jobs on a queue and process them one
  (or few) at a time instead of running everything in one go.
  [Source: topic-122967 reply — "combining browser automation with
  queue-based logic in n8n — helps manage retries and failures much
  better than running everything in one go".]
- **Node sketch:** see `n8n-queue-retry-sketch.json` in this directory
  (node list / JSON fragment, not a full workflow). Shape: Schedule or
  Webhook trigger → queue enqueue (one item per supplier SKU/page) →
  worker loop (dequeue → browser/HTTP fetch → extract delta → store) →
  per-item outcome (success / retryable / fatal) → dead-letter store for
  fatal and exhausted items → human alert on dead-letter, never silent
  drop.
- **Retry rules (load-bearing):**
  1. Retry only *retryable* failures: transient network errors, 5xx, and
     timeouts. Cap retries (suggested starting point: 3 attempts total,
     with backoff + jitter between them — the implementing builder sets
     the final numbers and records them).
  2. Never retry a *fatal* failure: HTTP 403/block page, CAPTCHA
     challenge, login wall, or an explicit bot-control response. Those go
     straight to dead-letter + human escalation (§6), and the supplier's
     queue is paused — classification fires on block/CAPTCHA, never
     auto-retry into a control. Retrying a block is how a rate problem
     becomes a ban. After such an event, §3 measures are FORBIDDEN for
     resuming the paused scrape (§3 table); the sketch's Classify node
     enforces the same line.
  3. One item's failure never blocks the queue: log it, dead-letter it,
     move on. A stuck queue item must not stall every other supplier.
  4. Every attempt is logged with supplier, SKU/page, profile used,
     outcome, and timestamp — so a block pattern (e.g. "every request
     after the 40th fails") is visible instead of anecdotal.
- **Start small, per the supplier-API pattern's discipline:** one
  supplier, one product class, one delta table, one update path — before
  running every supplier together. [Source: topic-308744 — "keep the
  first version very boring: one supplier, one product class, one delta
  table, and one Tray update path".]

## 5. What to extract — delta discipline

Source: n8n community topic-308744 (supplier-API thread: "only send
updates when something has changed"; "pass IDs, URLs, and changed fields
through the workflow, not full product blobs").

- **Extract IDs, URLs, and changed fields ONLY.** The scrape output per
  item is: supplier SKU/ID, listing URL, and the fields that changed
  since the last successful run (price, availability, title if changed).
  Never pass full product blobs through the workflow, and never
  re-download images into n8n — keep images as external URLs unless a
  specific step needs the bytes.
  [Source: topic-308744 — "pass IDs, URLs, and changed fields through
  the workflow, not full product blobs"; "avoid downloading product
  images into n8n and use image URLs whenever possible".]
- **Compare before writing.** Each run compares scraped values against
  the last stored snapshot and writes only the delta. No change → no
  write, no storefront update, no downstream noise.
- **First-run baseline (F4) — the one bounded exception.** A delta
  requires a baseline snapshot, so the FIRST run for a supplier
  necessarily reads more than a delta. That baseline read is limited to
  the APPROVED SKU SET only (the SKU list in the §1.1 approver record),
  happens once, and is recorded as a baseline (supplier, SKU count,
  date) on the browser-profile checklist — never a whole-catalog copy.
  Every run after the baseline is delta-only. "First run" does not
  re-open on later runs: a second full read is a new baseline and needs
  a new approver record stating why.
  [Source: topic-308744 — "compare stock/prices, and only send updates
  to Tray when something has changed".]
- **Keep batches small and memory-light.** The supplier-API discussion
  found batch size is the wrong lever on its own; the shape that works is
  per-batch work in a sub-workflow returning only a short result (e.g.
  the SKUs changed), so the parent holds results, not every product
  touched. Apply the same shape to scrape batches: a batch returns
  changed SKUs, not catalogs.
  [Source: topic-308744 — "Put the per-batch work in a sub-workflow…
  returning only a short result such as the SKUs you changed".]
- **Why delta discipline matters doubly for scraping:** every field
  extracted is a field that must be re-fetched, re-parsed, and re-stored
  on a fragile path. Extracting everything "just in case" multiplies
  breakage surface and bot-shaped traffic for data nobody uses.

## 6. Failure handling — blocks and CAPTCHAs

- **On a block (403, block page, IP/profile ban): STOP that supplier's
  queue.** Do not rotate to a fresh profile/IP to continue the same
  scrape — that is evasion of a ban, not a retry (§1.2). Dead-letter the
  affected items, alert a human, and record the block (supplier, time,
  profile, what was being fetched). §3 measures are FORBIDDEN for
  resuming the paused scrape (§3). Resume only on approver approval
  after the cause is understood (rate? ToS? fingerprint?), the
  robots/ToS re-check is re-run (F7), and a NEW approver record names
  the block cause and why resumption is not evasion.
- **On a CAPTCHA: NO automated solving against explicit bot controls,
  period (F2).** The previous wording ("NEVER auto-solve … without
  human approval") is removed because it literally permitted auto-solving
  with approval. The rule now, without qualifier: no automated CAPTCHA
  solver — no solver service, no solver node, no solver API call — may
  be wired into any workflow under this pattern, with or without
  approval. The workflow stops that item, dead-letters it, and alerts a
  human. A human may solve a SINGLE challenge MANUALLY, per challenge,
  where that is lawful and allowed — and every manual solve is logged
  (date/time, supplier, challenge type, human solver name, item/SKU,
  decision: proceed or pause supplier). Manual solving is not a
  standing permission: it covers that one challenge only. Repeated
  CAPTCHAs for a supplier are treated as a block event: pause that
  supplier's queue (§3 line applies) and escalate to the approver.
  (This rule is a deliberate guardrail added by this pattern's brief;
  it is not quoted from the community threads, which do not address
  CAPTCHA solving.)
- **On repeated transient failures:** after the retry cap (§4), the item
  goes to dead-letter with its full attempt log. Dead-letter is reviewed
  by a human on a schedule; it is never auto-purged silently.
- **On partial data:** a run that returns some items and fails others
  still writes the successful deltas and dead-letters the failures. A
  failed item must not roll back or block good data, and a partial run
  must not be reported as a complete sync.
- **On supplier site change (selectors/layout break):** treat as fatal
  for that supplier until a human updates the extraction mapping. Do not
  guess-parse a changed page — a mis-parse writes wrong prices to the
  storefront, which is worse than a missed update.

## 7. Sources and evidence strength

Every rule above cites its community source inline. Summary:

| Source | What it actually is | What it supports here |
|--------|---------------------|----------------------|
| topic-122967 (Vincatle, 2025-05-29; Jue reply 2025-05-30) | Trend post + 1 reply, n8n community | Antidetect tools named; isolated profiles; browser via API/CLI; queue-based retries |
| topic-176926 (Vincent Chan, 2025-08-27; Thelma Robinson reply 2026-05-16) | Unsolved-problem report + 1 reply's advice | 1688 anti-bot difficulty; rotating residential proxies; random delays; browser headers on HTTP node |
| topic-308744 (supplier-API thread) | Practitioner discussion, incl. "very boring first version" advice | Delta discipline: IDs/URLs/changed fields only; compare-before-write; sub-workflow batching; one-supplier start |

What the sources do NOT prove: that any named antidetect tool works
against any named anti-bot system; any pricing, reliability, or
detection-rate claim; any CAPTCHA policy (see §6, which is a brief
guardrail, not a community quote); or that scraping a specific supplier
is permitted (see the per-supplier check in `robots-tos-check-checklist.md`).
A future builder must verify tool and permission claims against the
supplier itself before first run — this doc is not that verification.

## 8. Secrets

Secrets (antidetect tool API keys, proxy credentials, any supplier
account credentials — though §1.2 excludes login-walled scraping) live
in environment variables / the vault ONLY. Never in this doc, in the
templates, in workflow JSON, in logs, or in examples. Templates use
obviously fake placeholders such as `PROXY_HOST_EXAMPLE` /
`ANTIDETECT_API_KEY_EXAMPLE` (see templates). If a real secret is ever
found in a doc or template, treat it as an incident: rotate it, then
remove it.

## 9. Templates in this directory

- `browser-profile-checklist.md` — one checklist per supplier (fields
  only, no credentials).
- `n8n-queue-retry-sketch.json` — queue/retry node sketch (fragment,
  not a full workflow).
- `robots-tos-check-checklist.md` — robots/ToS check to run before the
  first scrape of any supplier.

## 10. What this doc does not cover (for the reviewer to confirm)

- Which antidetect tool to buy, at what plan — undecided from the
  evidence (see §2).
- Final retry counts / delay ranges — starting points given in §4; the
  builder sets and records finals.
- Any specific supplier's permission status — the per-supplier checklist
  must be completed per supplier; no supplier is pre-approved by this doc.
- Re-check cadence (F7): the robots/ToS checklist is re-run at least
  quarterly AND after any block event, AND before resuming any paused
  supplier. A supplier whose re-check is overdue is paused until the
  re-check is done.
- Legal review of any specific scrape — if a supplier's ToS is ambiguous,
  that is a human/legal decision, not a pattern-doc decision.
