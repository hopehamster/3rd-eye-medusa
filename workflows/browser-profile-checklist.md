# Browser-profile checklist — one per supplier

> Copy this file per supplier. Fields only — NO credentials, NO API keys,
> NO proxy passwords here. Secrets live in env vars / vault only
> (see pattern doc §8). Placeholders below are obviously fake.

- Supplier name: `EXAMPLE_SUPPLIER`
- Supplier base domain: `example-supplier.invalid`
- Decision-ladder record (pattern doc §1):
  - API checked? (yes/no + date + result): ___
  - Feed requested? (yes/no + date + supplier reply): ___
  - CSV/manual tried? (yes/no + why insufficient): ___
  - Alternative supplier checked? (yes/no + result): ___
  - Gate (§1.1) all true? (yes/no + approver [project owner] + date + reasoning + scope): ___
- Explicit-ban check: ToS explicit ban or robots.txt disallow? (if YES: HARD STOP, no override — pattern doc §1.1(3)): ___
- §3 approved-risk record (approver + date + reasoning + scope; §3 measures permitted only before any block event, FORBIDDEN after one for resuming a paused scrape): ___
- Proven winner evidence (sales + period + threshold applied + date) and sole-source ladder record: ___
- Robots/ToS check completed? (see `robots-tos-check-checklist.md`, date + outcome): ___
- Antidetect tool: `EXAMPLE_TOOL` (Hidemium / GoLogin / Incogniton / other — record choice + reason)
- Profile ID / name (reference only, not a secret): `PROFILE_EXAMPLE_SUPPLIER_01`
- Profile fingerprint notes (OS/browser version family only, no identifying tokens): ___
- Proxy assignment (provider + type only, e.g. "residential, rotating"):
  - Provider: `EXAMPLE_PROXY_PROVIDER`
  - Proxy host reference (env-var name, NOT the value): `SUPPLIER_PROXY_HOST_EXAMPLE`
  - Rotation policy: ___
- Cookie storage: (profile-local only; never shared across suppliers; NEVER authenticated session cookies for the scraped supplier — a profile found with one is retired + escalated, pattern doc §2/F6): ___
- Delay policy (random range, e.g. "between X and Y seconds, jittered" — builder sets finals): ___
- Data to extract (IDs / URLs / changed fields only, pattern doc §5): ___
- Queue name for this supplier: `scrape-queue-example-supplier`
- Retry cap + backoff for this supplier: ___
- Dead-letter / alert destination (channel name only, no webhook secrets): ___
- First-run baseline (F4): date + approved SKU set (list/count) — baseline read limited to this set, once; later runs delta-only: ___
- Last successful run: ___
- Last block / CAPTCHA event (date + outcome + approver decision; after a block, §3 measures FORBIDDEN for resuming the paused scrape, pattern doc §3/§6): ___
- Manual CAPTCHA solve log (per challenge: date/time, challenge type, solver name, item/SKU, proceed-or-pause decision; NO automated solving, period): ___
- Robots/ToS re-check due (F7: quarterly AND after any block AND before resuming a paused supplier; overdue = paused): ___
- Profile retired? (yes/no + reason + date): ___
