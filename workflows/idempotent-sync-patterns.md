# Idempotent Sync Patterns — make every sync safely re-runnable

**Status:** Standard (draft for independent review). Not a deployed workflow, not a verified live integration.
**Parent:** #111. **This issue:** #119. **Companion:** `supplier-api-pattern.md` (#118) — read it for the supplier-fetch shape (HTTP nodes, delta-only, batches); this document governs what happens when a sync writes, retries, or approves.
**Boundary in one line:** This pattern covers sync writes and approvals so a re-run produces the same result as the first run; it does not cover owning inventory — for 3rd Eye, CJ fulfills and 3rd Eye holds no inventory, so "inventory sync" here means availability/digest sync, not stock 3rd Eye owns.

## Sources and corrections — read this first

Every rule below cites the n8n community thread it came from: topic
316681, "How to automate purchase-order and inventory syncing between an
ERP and other apps in n8n" (2026-09-26 to 2026-10-19), in
`~/workspace/3rd-eye-supply/n8n-community/topic-316681-po-inventory.json.md`.
Note on the evidence: the local copy of that thread truncates mid-post-16
(posts 1–15 are complete and cover every rule in this standard); nothing
below depends on the truncated tail. The thread is forum advice about an
ERP (ROCKEYE) sync, not a verified 3rd Eye integration — two corrections
apply before any rule is used:

1. **"Data Store" means Data Table in current n8n.** Early posts say
   "Data Store"; post 3 corrects this: "in n8n this would be a Data Table
   (Upsert row operation), there isn't a separate 'Data Store'." This
   standard uses Data Table throughout.
2. **n8n-side checks cannot close races the API does not enforce.**
   Post 8 is explicit: reading a record in one node and approving it in
   the next still leaves a race, and "an n8n-side check alone cannot close
   this race if other writers can still modify the PO." Rule 10 therefore
   requires an atomic API-side check and says plainly what to do when
   the API does not offer one (do not fake it — see the rule).

## Secrets rule (applies to every example in this document)

Secrets live in environment variables or n8n credentials ONLY. Never in
workflow JSON that gets shared, never in docs, never in Code node
literals. All examples use obviously fake placeholders: `ERP_API_KEY=<env>`,
`CJ_API_KEY=<env>`, `MEDUSA_ADMIN_TOKEN=<env>`. One credential path per
environment; never copy a token into a Code node (topic 316681, post 6).

---

## Rule 1 — Every record gets a stable external key

**Rule.** Give every synced record a stable external key before any
write: the source system's own identifier (ERP PO number, supplier SKU,
movement ID), or a composite key of `source system + record ID +
operation + version/date` where the source offers no single key. The key
must be stable across re-runs: the same source record always produces
the same key.

**WHY — the failure it prevents.** Without a stable key, a retry cannot
tell "already written" from "new", so the safe-looking recovery (re-run
the sync) creates duplicates. The thread calls this "the one that
actually matters" and "the one that bites": a PO sync that follows the
idempotent pattern "can be re-run any number of times with the same
result, which is exactly what you want when someone kicks off a resync
after an outage."

**Concrete example.** PO `PO-8841` syncs, then the workflow times out
after the write. Without a key, the re-run creates a second PO in the
destination. With `PO-8841` as the key, the re-run finds the existing
record and updates it instead — one PO, not two.

**Node pattern.** A Code/Set node at the start of the write path
computes the key (e.g. `{{ $json.source }}-{{ $json.po_number }}` or the
movement ID for inventory movements) and carries it on every item
downstream. No write node runs without the key on its input.

**Done when.** A builder can name the key formula for each synced record
type, and two runs over the same source feed produce identical keys for
identical records.

**Source:** topic 316681, post 2 (Alan Eisenberg: "give every record a
stable external key (the ERP's own PO number or a row hash)"), post 6
(tlfcjsdl1: idempotency key as `source system + PO/inventory ID +
operation + version/date`), post 9 (Mukarram_Ali: "establish a stable
external ID for every ERP record and store the last successfully
processed state").

## Rule 2 — Check-exists-then-upsert; never blind-insert

**Rule.** Before writing, check whether the destination record already
exists (by the Rule 1 key); if it does, update it, otherwise insert it.
Prefer the destination's native upsert where one exists. This is the
primary duplicate guarantee — dedupe nodes (Rule 4) are a guard on top
of it, not a substitute for it.

**WHY — the failure it prevents.** Blind inserts turn every retry,
every re-run, and every half-finished execution into duplicates. The
check-then-upsert shape is what makes retries safe at all: once the
write is an upsert keyed on a stable key, running it twice converges
instead of doubling.

**Concrete example.** A finance entry for PO `PO-8841` is written, then
the run fails before recording success. The re-run blind-inserts a
second finance entry and the books are wrong by one PO. With
check-exists-then-upsert, the re-run finds the entry and updates it in
place; the books stay correct.

**Node pattern.**
`Code (compute key) → HTTP Request / Data Table (lookup by key) → IF (exists?) → HTTP Request (update) / HTTP Request (create)`.
Where the destination supports upsert in one call, use that single call
instead of the branch — fewer nodes, smaller race window. Record the
external record ID plus operation/status before retrying (post 9), so a
timeout does not erase knowledge of what was attempted.

**Done when.** The same record sent through the write path twice yields
exactly one destination record, verified by count, not by "the run was
green."

**Source:** topic 316681, post 2 (Alan Eisenberg: "before writing,
check-if-exists-then-update-else-insert"), post 6 (tlfcjsdl1: "Prefer
upsert where the target supports it"), post 9 (Mukarram_Ali: "store the
external record ID plus the operation/status before retrying").

## Rule 3 — Retry only on 5xx and timeouts; everything else goes to a review queue

**Rule.** Enable retries (node Settings → Retry On Fail) only for reads
and for writes that are already upserts, and only on 5xx responses and
timeouts. Validation, auth, and permission errors (4xx other than 429)
are never retried — they route to a visible review queue. A 429 (rate
limit) is not a blind retry either: honour `Retry-After` where supplied,
otherwise use bounded backoff with jitter, then leave the work pending
and alert when the retry budget is exhausted.

**WHY — the failure it prevents.** Blind retry is how a transient
failure becomes a duplicate or a storm: retrying a validation error
loops forever on data that will never validate; retrying a non-idempotent
write doubles it; retrying into a rate limit deepens the limit. Routing
non-retryable errors to a review queue makes them visible instead of
invisible — a sync that "ran green" while silently dropping invalid
records is worse than a sync that visibly queued them.

**Concrete example.** A PO write returns 400 because a required field
changed shape upstream. Blind retry sends the same bad payload 3 times,
then the run reports failure with no record of which PO was bad. With
this rule, the 400 routes the PO (with its source payload and reason) to
a review queue, the run completes, and a human fixes the mapping and
replays that one record.

**Node pattern.** Node Settings: Retry On Fail with Max Tries and Wait
Between Tries, scoped to the read/upsert nodes only — plus an Error
branch / IF on status code after each write: `5xx or timeout → retry
path; 429 → Wait (Retry-After / backoff) then pending + alert if budget
exhausted; 4xx → review queue (store payload + reason)`. Never set
"retry on fail" globally on a workflow containing non-idempotent writes.

**Done when.** A forced 500 on a read retries and then succeeds; a forced
400 on a write appears in the review queue exactly once with its payload
and reason, and is not retried.

**Source:** topic 316681, post 2 (Alan Eisenberg: "only retry on 5xx
and timeouts, never blindly"), post 3 (PurveshGandhi: "I'd only turn it
on for reads and for writes that are already upserts"), post 6
(tlfcjsdl1: "bounded retries for 429/5xx/network failures, but route
validation/auth/permission errors to a visible review queue"), post 15
(Marchik: rate-limit handling and "leave the work pending and alert
someone when the retry budget is exhausted").

## Rule 4 — Remove Duplicates is a dedupe guard, not the guarantee

**Rule.** Add the Remove Duplicates node as a cheap guard on top of
Rules 1–2, keyed on the stable key (e.g. PO number + status). Treat it
as insurance against a half-finished rerun double-processing items
within its memory — not as the mechanism that makes writes safe.

**WHY — the failure it prevents.** A rerun that re-reads a page it
already processed can push the same items through the write path twice
in quick succession. The guard catches that cheaply before the write
nodes ever see the duplicate. But the guard alone cannot save a sync:
its memory is bounded, and a duplicate that arrives after the guard's
memory has moved on passes straight through — which is why the
check-exists-then-upsert in Rule 2 remains primary.

**Concrete example.** A sync crashes after writing 40 of 100 POs and is
re-run from the start. The first 40 POs re-enter the workflow; the
Remove Duplicates node drops them (it remembers them from the previous
execution), so the write path sees only the 60 unprocessed POs. Without
the guard, the write path would rely entirely on upsert correctness
under re-entry — which should still hold, but now has no second layer.

**Node pattern.**
`… → Remove Duplicates (mode: Remove Items Processed in Previous Executions, key = PO number + status, or movement ID for inventory) → write path (Rule 2)`.
Know the limit: the node remembers 10,000 values by default (post 3).
If a sync's re-entry window exceeds that, say so in the workflow's
notes and rely on Rule 2 — do not silently assume the guard covers it.

**Done when.** A re-run over an already-processed page sends zero items
to the write path from the guard alone, and the workflow notes state
the guard's key and its 10,000-value default limit.

**Source:** topic 316681, post 3 (PurveshGandhi: "the Remove Duplicates
node has 'Remove Items Processed in Previous Executions', keyed on
something like PO number + status. It remembers 10,000 values by
default. Cheap insurance on top of upserts"), post 2 (Alan Eisenberg:
"add a dedupe guard so a half-finished rerun can't double-create").

## Rule 5 — Cursor pagination with a stored sync cursor; checkpoint after each page

**Rule.** Paginate with the API's cursor where one is offered (HTTP
Request node → Option → Pagination, "Response Contains Next URL" or
"Update a Parameter in Each Request"); otherwise use offset with a hard
cap. Persist the sync cursor/checkpoint in a Data Table (Upsert row
operation) and advance it after each page succeeds — never only at the
end of the whole run. Each run resumes where the last finished instead
of re-pulling the world.

**WHY — the failure it prevents.** A sync that re-pulls the world every
run wastes quota and re-exposes every record to the duplicate paths in
Rules 1–4. A sync that checkpoints only at the end loses all progress
when it dies on page 9 of 10 and must redo pages 1–9 — and if those
pages contained writes, redoing them tests idempotency under real
pressure instead of avoiding it.

**Concrete example.** A 10-page inventory pull dies on page 9. With
per-page checkpoints, the next run resumes at page 9. With end-only
checkpointing, it redoes pages 1–8 (8 pages of re-reads, re-diffs, and
re-writes that only idempotency saves from becoming duplicates).

**Node pattern.**
`Data Table (read last cursor) → HTTP Request (Pagination option, or explicit loop for offset) → per-page processing → Data Table (upsert new cursor) → next page`.
Keep pagination isolated from processing logic (post 9): each returned
batch goes through the same normalisation/validation path, so a page
boundary never changes what a record means.

**Done when.** Killing a sync mid-run and restarting it resumes from the
last completed page (shown by the stored cursor), not from page 1, and
no record from a completed page is re-written.

**Source:** topic 316681, post 2 (Alan Eisenberg: "cursor-based if the
API offers it, otherwise offset with a hard cap and a sync cursor
stored in a Data Store row"), post 3 (PurveshGandhi: native HTTP
Request Pagination option; "Sync cursor / token storage: in n8n this
would be a Data Table (Upsert row operation)"), post 9 (Mukarram_Ali:
"keep pagination isolated from the processing logic"), post 13
(Zeke_2007: "a checkpoint saved after each page").

## Rule 6 — UTC checkpoints plus an overlap window (the timezone-boundary trap)

**Rule.** Store every incremental-sync checkpoint in UTC, and pull with
a small overlap window before the checkpoint (re-reading slightly
overlapping data), letting idempotent writes absorb the re-reads.
Never store a checkpoint in local time, and never trust a
"changed since X" filter whose two sides disagree about timezone.

**WHY — the failure it prevents.** This is the thread's most underlined
trap, because it is invisible: if the "everything updated since X"
filter runs on UTC in n8n but the source stamps `updated_at` in its own
local timezone (or vice versa), records changed in the hour around
midnight get skipped exactly once per day. Every log looks clean; the
numbers quietly stop matching weeks later, and three "the sync is fine"
reviews miss it because everyone checks the code and nobody checks the
clock. The same trap reappears at DST transitions and across server
timezones when the checkpoint is stored in local time.

**Concrete example.** Source stamps in local time, n8n filters in UTC.
A record updated at 23:30 local (which is 03:30 UTC next day, or the
reverse depending on offset) falls on the wrong side of the filter and
is never pulled. With a UTC checkpoint plus, say, a 1-hour overlap
window, that record is re-read on the next run and the idempotent write
absorbs the duplicate harmlessly.

**Node pattern.**
`Data Table (read UTC checkpoint) → Code (checkpoint minus overlap window, formatted in UTC) → HTTP Request (updated_since = that UTC value) → … → Data Table (write new UTC checkpoint only after the page succeeds)`.
The overlap size is a documented constant in the workflow (e.g. 1
hour), not a magic number buried in an expression. State which side
(source or n8n) normalises to UTC, and verify it — do not assume both
sides already agree.

**Done when.** A test record updated in the hour around midnight (and,
where DST applies, around a DST transition) is picked up by the next
sync run, and the run log shows the checkpoint in UTC with the overlap
applied.

**Source:** topic 316681, post 4 (Alan Eisenberg: timezone boundary,
"normalize to UTC on one side of the filter, or use an overlap window
and let idempotent writes absorb the re-reads"), post 7 (Alan
Eisenberg: "Store checkpoints in UTC and include a small overlap window
that the movement-ID dedupe then safely absorbs"), post 10
(henrikbusch: "the timezone-boundary trap on incremental pulls is the
one I'd underline twice").

## Rule 7 — Movements-vs-quantity decides your write semantics ("add 42" retries double, "set to 42" doesn't)

**Rule.** Before building an inventory sync, establish whether the
source returns the **current stock quantity** or individual **stock
movements** — and let the answer decide the write semantics. Movements:
each movement ID is the idempotency key; write it once and a retried run
is a no-op. Quantity only: use "set to N" semantics with a checkpoint
plus a tolerance window, and never apply a quantity as an increment.

**WHY — the failure it prevents.** A retry means opposite things for the
two shapes. "Add 42" retried counts the same movement twice and inflates
stock by 42. "Set to 42" retried converges. Worse, "set to 42" applied
from stale data silently overwrites a change that happened mid-sync —
so quantity-only syncs need the checkpoint/tolerance discipline from
Rule 6, not just set-semantics.

**Concrete example.** A movement "received 42 units, movement ID
`mv-991`" is applied twice because of a timeout retry: stock reads
+84 instead of +42, and the next customer order oversells against phantom
stock. Keyed on `mv-991`, the second application is a no-op. Conversely,
a quantity snapshot "42 units" read at 10:00 and written at 10:05
overwrites a 10:03 sale that took stock to 39 — unless the write carries
a checkpoint/tolerance check that detects the intervening change.

**Node pattern.**
`IF (source shape = movements) → Code (key = movement ID) → upsert movement record → apply once.`
`IF (source shape = quantity) → Code (set semantics, checkpoint + tolerance window) → IF (data newer than checkpoint?) → write set value, else hold for review.`
Never derive an increment from two quantity snapshots and apply it as
"add the difference" — that reintroduces the double-count on retry.
For 3rd Eye: CJ availability snapshots are quantity-shaped, so the
quantity branch applies, and the result is an availability/backorder
decision — not an increment to stock 3rd Eye owns.

**Done when.** The workflow's notes name the source shape (movements or
quantity) with evidence from the API docs or a sample response, and a
forced retry of one movement (or one quantity write) changes the
destination exactly once (or not at all, for a duplicate movement).

**Source:** topic 316681, post 5 (Ayub_Shah: "'set stock to 42' versus
'add 42.' The second one could count the same movement twice… use each
movement's ID when writing"), post 7 (Alan Eisenberg: movements-vs-
quantity "decides your write semantics… If it exposes only current
quantity, you need a checkpoint… plus a tolerance window, because 'set
to 42' on stale data silently overwrites a change that happened
mid-sync").

## Rule 8 — A token-refresher workflow writes fresh tokens to a Data Table; consumers only read

**Rule.** For short-lived OAuth tokens, run a tiny dedicated
token-refresher workflow on a schedule that writes the fresh token to a
Data Table. Every sync workflow reads from that table; none refreshes
inline. If the API supports a long-lived API key in a header, prefer
that in an n8n credential (never in workflow JSON) and skip the
refresher. One credential path per environment.

**WHY — the failure it prevents.** Inline refresh duplicated across
workflows means one refresh serves one workflow while the others 401,
and a 401 in one workflow cascades into competing refresh attempts.
One refresher serving every sync means one place owns freshness, one
place is monitored, and a 401 never cascades.

**Concrete example.** Three sync workflows each refresh inline. The
token endpoint rate-limits the second refresh, so workflows 2 and 3 run
with stale tokens and 401 for an hour. With a single refresher writing
to a Data Table, all three read the same fresh token and none touches
the refresh endpoint.

**Node pattern (refresher).**
`Schedule Trigger (well before expiry) → HTTP Request (refresh endpoint, refresh credential from env/credential store) → Data Table (upsert token row with expiry)`.
**Consumer pattern.** `Data Table (read token row) → IF (expiry approaching? → alert, do not inline-refresh) → HTTP Request (token from table)`.
See also `supplier-api-pattern.md`, Rule 7 (the non-standard-auth
version of this rule, e.g. Tray's token-in-URL shape).

**Done when.** Exactly one workflow writes the token row, every consumer
reads it, and rotating a token requires changing one place.

**Source:** topic 316681, post 2 (Alan Eisenberg: "run a tiny dedicated
'token refresher' workflow on a schedule that writes the fresh token to
a Data Store - other workflows read from there, so one refresh serves
every sync and a 401 never cascades"; "use a long-lived API key in a
header and keep it in n8n credentials (never in the workflow JSON)"),
post 6 (tlfcjsdl1: "Keep one credential path per ERP environment and
avoid copying tokens into Code nodes").

## Rule 9 — Separate data sync from business actions

**Rule.** Put data sync (inventory levels, PO states, availability) and
business actions (approval emails sent, POs created in a destination,
customer notifications) in separate workflows with different guarantees.
Data sync must be reconciled and safely re-runnable; business actions
must never fire twice.

**WHY — the failure it prevents.** A combined workflow makes a failed
nightly sync cost a re-sent approval email to a vendor, a duplicate
customer notification, or a second PO — because re-running the sync
re-fires the actions embedded in it. Separated, a failed sync costs a
re-run of the sync only; the actions fire from their own workflow, on
their own trigger, with their own idempotency.

**Concrete example.** A nightly sync both updates inventory and emails
vendors about POs. It fails halfway. Re-running it to finish the
inventory update re-sends the vendor emails for the POs already
processed. Separated, the re-run updates inventory only; the vendor
emails were already sent once by the action workflow and are not
re-sent.

**Node pattern.** Workflow A (sync): `Schedule → paged pull → upserts → checkpoint`. Workflow B (actions): `trigger on synced-state change (or its own schedule over synced state) → threshold/approval logic → action → audit row`.
No email/Slack/PO-creation node lives in Workflow A. The seam between
them is the synced state (Data Table / destination records), not a
shared execution.

**Done when.** Re-running the sync workflow alone produces zero emails,
zero vendor notifications, and zero destination POs — verifiable by
running it twice and counting side effects, not by reading the diagram.

**Source:** topic 316681, post 6 (tlfcjsdl1: "separate data sync from
business actions. That makes retries much safer"), post 7 (Alan
Eisenberg: "data sync… can be reconciled and re-run safely; business
actions… must never fire twice. Once they're in separate workflows with
different guarantees, a failed nightly sync costs you a re-run, not a
re-sent approval email to a vendor"), post 9 (Mukarram_Ali: "separate
this into small workflows rather than one large ERP sync").

## Rule 10 — Approvals bind to the exact revision, checked atomically by the API — never by n8n alone

**Rule.** An approval request binds to the exact revision (and amount,
terms, and line items) the approver saw. The destination API must check
the expected revision atomically with the approval transition — an
`expected_revision` parameter or an `If-Match` precondition using the
record's strong ETag. A revision conflict stops that approval attempt,
marks the old request superseded, and routes the changed record through
fresh review under the policy for its new amount/terms. Never
auto-fetch the latest revision and retry the approval — that defeats the
protection. Record who approved, when, the amount/version approved, and
the source record used for the decision, in an audit row outside the
running execution.

**WHY — the failure it prevents.** The thread's worked trap: a manager
receives an approval request for revision 7 at $8,000; purchasing
updates the order to revision 8 at $18,000; the manager clicks the
original Approve button. If approval resolves by PO ID alone, that click
authorises $18,000 of terms the manager never reviewed. The subtler
version is the race inside the workflow itself: reading the PO in one
node and approving it in the next leaves a gap in which anyone can edit
it — and no n8n-side check closes that gap if other writers can still
modify the record.

**Concrete example.** Revision 7 ($8,000) is approved by click while
revision 8 ($18,000) is current. With an atomic check, the API rejects
the approval with a revision conflict, the old request is marked
superseded, and revision 8 goes through fresh approval. Without it, the
$18,000 order posts as "approved" and the audit trail claims a manager
approved terms they never saw.

**Node pattern.**
`Approval request (state: PENDING_APPROVAL, pinned revision + details shown) → Wait/Slack Send-and-Wait for Response (with approver restriction + time limit, escalate to backup approver on timeout) → HTTP Request (approve with expected_revision / If-Match) → IF (conflict?) → mark superseded + fresh review; IF (success) → audit row (who, when, amount, version, source record) → state POSTED`.
Model approval as a state machine persisted outside the execution:
`DRAFT → PENDING_APPROVAL → APPROVED/REJECTED → POSTED`; a PO cannot
reach POSTED unless the workflow sees the approved state. Keep approval
webhook paths stable (a fixed path, or a stable router workflow that
never gets rebuilt): if the approve/reject link lives in a workflow that
gets renamed or rebuilt, every outstanding link in an inbox points at
nothing — include an "this link expired, here's the current status"
fallback.

**If the API does not support an atomic revision check, say so.**
Do not build an n8n-side read-then-approve and call it equivalent — the
thread is explicit that it is not. Options then are: (a) get the check
added to the API, (b) restrict who can edit a record while approval is
pending (a process control, named as such, not a technical guarantee),
or (c) do not automate that approval in n8n. The standard does not
permit (d) pretend.

**Done when.** Both of these tests pass, with the reason in the audit
trail: (1) edit the record while its approval notification is
outstanding, then approve from the old request — the changed record
remains unapproved under the old request; (2) edit the record between
the final read and the approval write — the approval is rejected as a
conflict, not applied. A revision conflict never auto-retries with fresh
data.

**Source:** topic 316681, post 8 (Marchik: revision-7/$8,000 →
revision-8/$18,000 trap; "The ERP needs to check the expected revision
atomically with the approval transition… An n8n-side check alone cannot
close this race"; "Automatically fetching the latest revision and
retrying approval would defeat the protection"; pass condition quoted
above), post 6 (tlfcjsdl1: state machine + audit fields), post 4 (Alan
Eisenberg: webhook path stability + expired-link fallback), post 13
(Zeke_2007: Slack Send-and-Wait with time limit + escalation; "Approve
in the ERP against the exact PO revision and log who approved"), post 3
(PurveshGandhi: Slack/Gmail/Teams Send-and-Wait for Response, Approval
type, with approver restriction).

## Rule 11 — A timeout is "unknown", not "failed": look it up before retrying

**Rule.** Treat a timeout (or any ambiguous response) after a write as
UNKNOWN, not failed. Before retrying, check whether the destination
record/action already exists (Rule 2 lookup). Only retry if the lookup
proves the write did not land.

**WHY — the failure it prevents.** "Retry on fail" after a timeout is
the classic duplicate factory: the write may have landed and only the
response was lost, so the retry writes it again. The lookup-first shape
is what separates "failed" (safe to retry) from "unknown" (must verify
first) — and it is also why Rule 3 restricts retries to upserts, where
the retry is harmless even if the lookup is skipped.

**Concrete example.** A PO creation call times out. The PO actually
landed in the destination. Blind retry creates a second PO; lookup-first
finds the existing PO by its Rule 1 key and treats the run as complete.

**Node pattern.**
`HTTP Request (write) → IF (timeout/ambiguous?) → HTTP Request (lookup by key) → IF (exists?) → mark complete, else → retry path (bounded, Rule 3)`.
Distinguish the two outcomes in logs and audit: "rejected because the
record changed" (needs fresh review, Rule 10) is different from
"request failed, outcome unknown" (needs a lookup, this rule).

**Done when.** A forced timeout after a successful write, followed by a
re-run, yields exactly one destination record — and the test for it is
in the handover: "test the same PO twice and force a failure after the
first external write. The final result should still exist exactly
once."

**Source:** topic 316681, post 6 (tlfcjsdl1: "treat the result as
unknown, not failed — check whether the target record/action already
exists before retrying"; the twice-plus-forced-failure test), post 13
(Zeke_2007: "Treat a timeout as unknown and look the record up before
retrying"), post 11 (Marchik: rejected-because-changed vs failed-and-
unknown are different outcomes needing different handling).

## Rule 12 — Validate the fields the mapping depends on; never default a missing quantity to zero

**Rule.** Before writing, validate the fields the mapping actually
depends on (record ID, revision, quantities and units, at minimum). An
extra optional field must not stop the sync. A missing quantity, a
changed unit, or a missing ID must hold that record for review with its
source payload and a clear reason — and the record must be retained
durably before the sync checkpoint advances, so fixing the mapping
gives you something to replay.

**WHY — the failure it prevents.** Defaulting a missing quantity to
zero to "keep the run green" writes a lie into the destination (zero
stock, or a zero-quantity order line) that looks like a real value to
every downstream consumer. Silently passing a changed unit through
(e.g. cases vs units) corrupts quantities by a multiplier. Holding the
record with its payload preserves both the evidence and the replay.

**Concrete example.** A supplier renames `qty` to `quantity`. A sync
that defaults missing `qty` to 0 writes zero stock for every product
and the store stops selling everything. A sync under this rule holds
every record for review with reason "missing qty", advances no
checkpoint past them, and resumes cleanly once the mapping is fixed.

**Node pattern.**
`… → Code/IF (required fields present + units as expected?) → write path; else → review queue (source payload + reason) → checkpoint does NOT advance past held records`.
Rate limits are handled differently from schema failures (Rule 3): a
rate limit delays the sync; a changed field must not quietly turn into
a wrong order.

**Done when.** Two handover checks pass: (1) a simulated 429 during a
read resumes without skipped records; (2) a renamed quantity field
produces zero downstream writes and the original records remain
recoverable for replay.

**Source:** topic 316681, post 15 (Marchik: validate dependent fields;
"Don't default a missing quantity to zero just to keep the run green";
"Retain the failed record durably before advancing the sync
checkpoint"; the two handover checks), post 14 (Chrome_nomads: rate
limits and schema changes as the open questions this rule answers).

## Rule 13 — Reconcile nightly: compare source and destination counts and totals

**Rule.** Run a separate nightly reconciliation that compares source
and destination counts and totals and alerts on drift — including
"sync ran but an expected record is missing", not only on failed
executions.

**WHY — the failure it prevents.** Every silent failure in this
document (the timezone trap in Rule 6, a held record nobody reviewed in
Rule 12, a checkpoint that advanced past a skipped page) looks like a
green run. Only an independent count/total comparison catches drift
before it becomes "the numbers don't match" weeks later. Reconciliation
is the backstop for the rules, not a replacement for them.

**Concrete example.** The timezone trap silently skips 3 records a day.
No execution fails. The nightly count comparison (source: 1,204 records
changed; destination: 1,201 applied) flags a drift of 3 on day one,
while the cause is still findable — instead of a 60-record gap found at
month-end.

**Node pattern (separate workflow, per Rule 9).**
`Schedule Trigger (nightly) → HTTP Request (source counts/totals) → HTTP Request / Data Table (destination counts/totals) → Code (compare) → IF (drift?) → alert with counts, not just "sync failed"`.
Keep it separate from the sync workflow so a broken sync cannot also
break its own watchdog.

**Done when.** A deliberately introduced drift (e.g. one destination
record deleted) triggers an alert naming the counts on both sides
within one nightly cycle.

**Source:** topic 316681, post 13 (Zeke_2007: "Nightly check: compare
ERP and destination counts and totals to catch silent drift"), post 6
(tlfcjsdl1: "alert on 'sync ran but expected external record is
missing,' not only failed executions").

---

## Worked mini-example — one inventory sync, end to end

**Setup (fake values only).** Source: an ERP-style API returning
quantity snapshots (not movements — so the quantity branch of Rule 7
applies). Destination: Medusa availability/digest for 3rd Eye's
dropship shape — CJ fulfills, 3rd Eye holds no inventory, so the sync
updates availability signals and a low-stock digest, and never books
stock 3rd Eye owns. Secrets: `ERP_API_KEY=<env>`. Scope: one inventory
flow, one product class, 10 SKUs.

1. **Schedule Trigger** (every 6 hours, matching the v1 workflow's
   inventory-sync cadence) starts the sync workflow — separate from any
   business-action workflow (Rule 9).
2. **Data Table — read checkpoint.** The workflow reads the last sync
   cursor: a UTC timestamp (Rule 6). It subtracts the documented
   1-hour overlap window and formats the result in UTC as
   `updated_since`.
3. **HTTP Request — paged pull.** `GET <erp base>/inventory?updated_since=<UTC value>`
   with header `Authorization: Bearer {{ $env.ERP_API_KEY }}`, using the
   HTTP Request node's Pagination option (cursor from the response, or
   page parameter — whichever the API offers, Rule 5). Each page goes
   through the same normalisation path.
4. **Code — key + validate.** Each record gets its stable key
   (`source + inventory ID`, Rule 1). The node validates the fields
   the mapping depends on (ID, quantity, unit). A record missing a
   quantity is held for review with its payload and reason, and the
   checkpoint does not advance past it (Rule 12). No quantity is
   defaulted to zero.
5. **Remove Duplicates — guard.** Keyed on inventory ID + status, the
   guard drops any item already processed in a previous execution
   (Rule 4) — insurance, not the guarantee.
6. **Check-exists-then-upsert.** For each surviving record, the workflow
   looks up the destination availability record by key and updates it
   ("set to N" semantics, Rule 7 — never "add N"), or inserts it if
   absent (Rule 2). A 5xx or timeout on a write retries within the
   bounded retry budget (Rule 3); a timeout is treated as unknown and
   looked up before any retry (Rule 11); a 400 routes to the review
   queue (Rule 3).
7. **Data Table — checkpoint per page.** After each page's writes
   succeed, the workflow upserts the new cursor (UTC, Rule 5/6). A
   crash on page 3 of 4 resumes at page 3, not page 1.
8. **Digest, not stock ownership.** The sync's output is an availability
   digest (which SKUs changed availability, which fell below the
   low-stock threshold) — the same shape as the v1 workflow's "Diff +
   low-stock digest" node. It does not write Medusa stock quantities as
   owned inventory, and it sends no customer or vendor notification
   (Rule 9: those live in separate workflows).
9. **Nightly reconciliation (separate workflow).** Once a night, counts
   and totals from source and destination are compared; any drift
   alerts with both counts (Rule 13).
10. **Verify (the proof).** Run the sync twice over the same feed, and
    force a failure after the first external write on the second run.
    Pass condition: every destination record exists exactly once, the
    digest shows the same changed SKUs on both runs, and no business
    action fired from the sync workflow itself.

**What this example deliberately does not do:** it does not retry 4xx
errors, does not default missing quantities, does not advance the
checkpoint past held records, does not approve anything (approvals are
Rule 10's separate state machine, bound to exact revisions with an
atomic API check), and does not claim the API supports that check until
a builder verifies it against the API's docs.

## What this standard does not cover

- Whether a given destination API (CJ, Medusa, or a future ERP)
  supports atomic revision checks, native upserts, or cursor pagination
  (verify per API before building; Rule 10 names the fallback when it
  does not).
- The exact checkpoint/overlap values for a production feed (the
  1-hour overlap above is an example constant, to be set from observed
  clock skew, not copied blindly).
- Workflow JSON templates (follow-up work: templates should encode
  Rules 1–13, not restate them).
- Any claim about live behaviour: this standard is derived from
  community evidence (posts 1–15 of topic 316681; the local copy
  truncates mid-post-16) and the v1 workflow file, not from a traced
  live execution. See "could not verify" in the delivery report.
