# Robots / ToS check — run before the FIRST scrape of any supplier

> Complete one copy per supplier and keep it with that supplier's
> browser-profile checklist. No scrape runs until every item is answered.
> An unanswered item is a STOP, not a "proceed and see". Approver for
> every approval on this checklist is the project owner (Michael) —
> not the operator, not the builder (pattern doc §1.1). Ambiguous ToS =
> approver decision under the narrow override below, not a pattern-doc
> decision, and never an override of an explicit ban.

- [ ] Supplier name + domain: ___
- [ ] Date checked + checked by (name): ___
- [ ] robots.txt fetched and read for the paths to be scraped?
  - robots.txt URL checked: ___
  - Relevant paths allowed, disallowed, or silent? ___
  - If disallowed for the paths to be scraped: HARD STOP for those
    paths — no approval may override a robots.txt disallow (pattern
    doc §1.1(3)): ___
  - Crawl-delay or rate guidance stated? (record it): ___
- [ ] Supplier Terms of Service / Terms of Use read (not skimmed)?
  - ToS URL: ___
  - Automated access / scraping / bots: explicitly allowed / explicitly
    banned / silent / ambiguous? (quote the relevant line, or note
    "silent"; if ambiguous, state exactly what is ambiguous): ___
  - If explicitly banned: HARD STOP — NO override, no run, routes are
    API / feed / manual / different supplier only (pattern doc
    §1.1(3)): ___
  - If silent or ambiguous ONLY: approver override record, made BEFORE
    any run — approver (project owner) name: ___ + date: ___ +
    reasoning: ___ + scope (supplier, data set, approved SKU set): ___
    (all four fields required; missing any field = no approval = STOP)
- [ ] Supplier API or data feed asked for in writing?
  - Asked (date + channel): ___
  - Supplier reply (or "no reply by ___"): ___
- [ ] Data scope confirmed as public listing data ONLY?
  - Fields to extract: ___
  - Any login-walled / account / private data in scope? (must be NO): ___
- [ ] Is this supplier already blocked/banned a previous profile, IP, or
  account for this purpose? (if YES: STOP — rotating identity to continue
  is evasion, escalate per pattern doc §6): ___
- [ ] CAPTCHA / bot-control posture understood?
  - Known controls on the target pages: ___
  - Agreed response on challenge: STOP + dead-letter + escalate; NO
    automated solving against explicit bot controls, period; human
    manual solving only, per challenge, logged (date/time, supplier,
    challenge type, solver name, item/SKU, proceed-or-pause decision)
    — pattern doc §6: acknowledged (initials): ___
  - §3 measures (rotating residential proxies, antidetect fingerprints,
    real browser headers) authorized for this supplier? Only before any
    block event, FORBIDDEN after one for resuming the paused scrape;
    per-supplier approved-risk record (approver + date + reasoning +
    scope): ___ (pattern doc §3)
- [ ] Rate plan set (random delay range + max requests per run)? ___
- [ ] Proven winner + sole source evidence (F5): sales evidence (orders
  and/or revenue + period): ___ + threshold applied by approver: ___ +
  date: ___ + ladder record showing no equivalent supplier: ___
- [ ] First-run baseline bound (F4): approved SKU set (list/count): ___
  — baseline read limited to this set, once; later runs delta-only: ___
- [ ] Approver for THIS supplier + THIS data set (project owner name +
  date + reasoning + scope): ___
- [ ] Decision: APPROVED to proceed / NOT APPROVED (circle one) + reason: ___
- [ ] Re-check date (F7): re-run this checklist at least QUARTERLY and
  after ANY block event and before resuming any paused supplier;
  next re-check due: ___ (overdue re-check = supplier paused)
