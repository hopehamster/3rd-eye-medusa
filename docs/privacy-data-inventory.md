# Privacy data inventory — 3rd Eye Supply

> **This is drafting work, not legal advice.** It is an internal working
> document prepared alongside the public privacy notice at
> `apps/storefront/src/app/[countryCode]/(main)/privacy/page.tsx`. Before the
> notice is published — and before the Oracle runs at scale — a qualified
> privacy lawyer in the relevant jurisdiction(s) should review both. Nothing
> here should be treated as a settled legal position, and anything marked
> `[FILL: ...]` is an open fact, not a decision.

Scope: the Medusa storefront (`apps/storefront`), its Postgres/Redis backend on
a Hostinger VPS, and the members-only Oracle chat. Business: 3rd Eye Supply,
sole proprietorship, Las Vegas, Nevada; ships metaphysical goods to US and EU
buyers.

---

## Data inventory

| Data | Purpose | Processor / recipient | Retention |
| --- | --- | --- | --- |
| Email address | Account identity, sign-in, order receipt, transactional notices, account recovery | Hostinger VPS (Postgres); Resend/SMTP for delivery | Life of account + [FILL: deletion grace period] |
| Password (one-way hash) | Authentication | Hostinger VPS (Postgres) — never leaves our server | Life of account; deleted with it |
| Phone number (optional) | Passwordless SMS sign-in via one-time code | Hostinger VPS (Postgres); Twilio (delivery) | Life of account, or until removed from profile |
| SMS one-time codes and attempts | Verify the sign-in, rate-limit abuse | Hostinger VPS (Redis) | [FILL: minutes/hours until expiry] |
| Shipping address (name, street, city, postcode, country) | Fulfil and deliver the order | Hostinger VPS; CJ Dropshipping (fulfilment) | Order life + [FILL: statutory record period] |
| Billing address | Card verification and fraud checks | Hostinger VPS; Stripe | Order life + [FILL] |
| Order history (items, amounts, dates, status, tracking) | Fulfilment, returns, refunds, accounting, support | Hostinger VPS; Stripe (payment records); CJ Dropshipping (fulfilment status) | [FILL: statutory tax/accounting period] |
| Payment metadata (last four digits, brand, outcome) | Reconcile orders, handle disputes | Stripe (primary); Hostinger VPS (reference only) | [FILL] |
| Cart contents and cart identifier | Keep the basket across pages and sessions | Hostinger VPS; `_medusa_cart_id` cookie in the browser | [FILL: cart cookie lifetime] |
| Session/auth token | Keep the user signed in | `_medusa_jwt` cookie; Hostinger VPS validates | [FILL: session lifetime] |
| Per-visitor cache identifier | Serve cached pages without mixing carts between visitors | `_medusa_cache_id` cookie | [FILL] |
| Locale / region choice | Show the right language, currency, and shipping options | `_medusa_locale` cookie | [FILL] |
| Analytics events (pages, clicks, referrer, device, browser, IP-derived approximate location, pseudonymous id) | Understand what is used and what is broken; product decisions | PostHog (US Cloud); gated on consent in the EU/UK | [FILL: PostHog project retention setting] |
| Oracle conversation (user messages + model replies) | Provide the Oracle; let a user return to a reading | Hostinger VPS (Postgres); DeepSeek (inference, China) | [FILL: period, or "until user deletes"] |
| LLM-extracted per-customer profile (preferences, interests, topics asked about and dismissed) | Continuity between Oracle conversations; relevance of suggestions | Hostinger VPS (Postgres); produced by DeepSeek extraction, stored by us | [FILL: period; state whether rebuilt, decayed, or kept indefinitely] |
| Product catalogue embeddings | Semantic product search | Voyage AI (US) — catalogue text only; [FILL: confirm whether customer query text is also sent] | [FILL: whether embeddings are stored and for how long] |
| Transactional email metadata (delivery, bounce, complaint) | Confirm a receipt or reset actually arrived | Resend / SMTP provider [FILL: which] | [FILL: provider log retention] |
| Server and access logs (IP, path, timestamp, user agent, errors) | Security, abuse prevention, debugging | Hostinger VPS | [FILL: log rotation period] |
| Support correspondence | Answer the question, keep a record of what was promised | Email provider; [FILL: helpdesk, if any] | [FILL] |
| Backups of the above | Recover from failure or corruption | Hostinger (snapshot/backup storage) [FILL: where] | [FILL: rotation period] |

Cross-check: the public notice states every row above. If a row is added here,
a section must be added there.

---

## Must be decided before publishing

These are open questions, not drafting gaps. Several of them change what the
policy is allowed to say.

**Identity and contacts**

1. Confirm the privacy contact email and the postal address to publish (a sole
   proprietorship may reasonably publish a business address rather than a home
   address — decide which, and consider a registered agent or PO box).
2. Decide whether to appoint an EU Article 27 representative and a UK Article 27
   representative. Selling to EU/UK buyers without an establishment there
   generally requires one; publishing "none appointed" is not a neutral choice.
3. Confirm whether any contractor, freelancer, or helper has production access.
   If so, the security section needs them named and bound.

**Lawful basis and the Oracle**

4. Confirm the lawful basis for **retaining** the LLM-extracted profile between
   conversations. The notice currently says legitimate interests; that requires
   a documented three-part assessment (purpose, necessity, balancing) on file.
5. Complete a **DPIA** (GDPR Art. 35) for the Oracle before it runs at scale:
   systematic profiling, new technology, inference, and a third-country
   transfer all point at "likely high risk". Decide who signs it and where it
   lives.
6. Decide what the extracted profile actually contains and cap it. If it can
   hold inferred health, belief, or sexuality data, that is special-category
   processing and the current design cannot lawfully continue unchanged.
7. Decide the deletion path for Oracle data: transcript rows, profile rows, and
   whatever the model provider retains. Write down who does it and how it is
   evidenced.
8. Confirm whether the Oracle prompt actually refuses to solicit sensitive
   details, and test it. The notice promises this.

**Transfers**

9. Sign SCCs (and the UK Addendum) with every processor that touches EU/UK
   data, not just DeepSeek.
10. Complete a **transfer impact assessment** for the China transfer to
    DeepSeek, documenting the state-access risk and the supplementary measures
    (minimisation, encryption in transit). Confirm whether any prompt or
    response logging happens on the provider side.
11. Confirm the Hostinger VPS datacentre country. The policy currently leaves it
    as a placeholder, and the answer changes the transfer analysis.
12. Confirm the CJ Dropshipping entity, its DPA, its sub-processors, and whether
    any warehouse or support team sits outside the US/EU.
13. Confirm Stripe's contracting entity and data region for our account.

**Retention**

14. Fill in every retention period in the table above, then mirror them in the
    notice. Where no decision exists, pick a defensible default and record the
    reasoning — "indefinitely" is not one.
15. Set the PostHog project retention to match what the notice says.
16. Decide the backup rotation and confirm that a deletion request can be
    honoured inside it (or say plainly how long it takes to age out).

**Consent, cookies, and marketing**

17. Confirm a consent banner is live for EU/UK visitors before the notice ships,
    and that PostHog does not initialise before consent.
18. Confirm no advertising pixels, retargeting tags, or session-replay tools are
    installed. The notice says there are none; if that is not true today, it
    must be changed or the tools removed.
19. Confirm whether any marketing email is sent at all. If yes, confirm
    double opt-in, the unsubscribe path, and EU ePrivacy compliance.
20. Decide whether customer search queries are embedded through Voyage AI. If
    they are, that is personal data going to a processor and needs a row and a
    basis.

**Security and operations**

21. Confirm disk-level encryption on the VPS, firewall rules on Postgres and
    Redis, and whether either database is reachable from the public internet.
    (If Redis or Postgres is exposed, fix that before publishing anything.)
22. Write the breach playbook: who detects, who decides reportability, the
    72-hour clock from awareness, and the contact list. Note that a processor
    breach starts our clock when *they* notify us.
23. Confirm an age gate or minimum-age statement at sign-up if the policy is
    going to say the shop is for adults.

**Records and governance**

24. Turn this inventory into the Article 30 record of processing activities —
    it is close to the right shape already, and a sole proprietorship still
    needs one.
25. Decide who reviews this page and how often (annually at minimum, and on any
    new processor, new purpose, or new country).
26. Add `/privacy` to the site footer so the notice is actually reachable
    before a purchase, not only by direct URL. Also link it from the account
    sign-up screen and the Oracle gate.

---

## Notes for the reviewer

- The notice deliberately avoids claiming certifications, seals, or a DPO it does
  not have.
- California language is included even though a sole proprietorship in Nevada may
  fall below the CCPA thresholds; the notice extends the rights rather than
  asserting that the statute binds. Confirm the threshold position before
  publishing — revenue, data volume, and the "sell/share" test all matter.
- Nothing in the notice promises a specific response automation; every right is
  fulfilled by hand, within statutory deadlines.
- If a processor is added or replaced, three places change together: the
  processor table in the notice, this inventory, and the transfer analysis.

*Drafting aid only — not legal advice.*
