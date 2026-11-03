import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | 3rd Eye Supply",
  description:
    "What 3rd Eye Supply holds, why we hold it, who else sees it, how long it stays, and the rights you can exercise — for customers in the United States and the European Union.",
}

// NOTE: every [FILL: ...] below is a fact that must be confirmed and written
// out before this page is published. See docs/privacy-data-inventory.md for
// the full pre-publication checklist. Nothing here should be invented to fill
// a gap — an inaccurate privacy notice is worse than a missing detail.

export default async function PrivacyPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Privacy Policy
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            What we hold, why we hold it, who else sees it, and how to get it
            back or have it taken away. Written to be read rather than clicked
            past.
          </p>
          <p className="mt-6 font-humanist text-xs uppercase tracking-widest text-paper-muted">
            Last updated: 31 October 2026 &middot; Effective: 31 October 2026
          </p>
        </header>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Who we are
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            3rd Eye Supply is a sole proprietorship run out of Las Vegas, Nevada,
            in the United States. We sell metaphysical goods — crystals, curios,
            and the supplies that go with them — and ship to customers in the
            United States and the European Union.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Under the EU General Data Protection Regulation and the UK GDPR we
            are the <strong className="font-semibold">data controller</strong>{" "}
            for the personal data described here. That means we decide what is
            collected and why, and we answer for it.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <span className="font-semibold">Legal entity:</span> 3rd Eye
              Supply, sole proprietorship (Las Vegas, Nevada)
            </li>
            <li>
              <span className="font-semibold">Business address:</span> [FILL:
              street address], Las Vegas, Nevada [FILL: ZIP], United States
            </li>
            <li>
              <span className="font-semibold">Privacy contact:</span> support@3rdeyesupply.com
            </li>
            <li>
              <span className="font-semibold">
                EU representative (GDPR Article 27):
              </span>{" "}
              We have not appointed an EU representative: we have no EU establishment, and privacy enquiries reach us directly at the address below.
            </li>
            <li>
              <span className="font-semibold">
                UK representative (UK GDPR Article 27):
              </span>{" "}
              We have not appointed a UK representative, for the same reason.
            </li>
            <li>
              <span className="font-semibold">Data Protection Officer:</span>{" "}
              none appointed. We are a one-person business and the GDPR reserves
              that role for specific situations. Privacy questions reach the
              owner directly, at the address above.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            What this policy covers
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            This policy covers the storefront at 3rdeyesupply.com, including
            browsing, creating an account, placing orders, and using the Oracle.
            It does not cover other companies’ sites, and it does not cover the
            payment page once you are handed to Stripe, which runs under its own
            privacy notice.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The data we hold
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We try to hold as little as the shop can run on. Here is all of it.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-3 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <span className="font-semibold">Account details.</span> Your email
              address and password. The password is stored as a one-way hash —
              we cannot read it, and neither can anyone who gets into the
              database.
            </li>
            <li>
              <span className="font-semibold">Phone number, if you give one.</span>{" "}
              Optional, and only used so you can sign in with a one-time SMS
              code instead of a password. Skip it and nothing changes.
            </li>
            <li>
              <span className="font-semibold">Addresses.</span> The shipping
              address you ask us to send to, and the billing address your card
              issuer checks against. Saved to your account so you do not retype
              them.
            </li>
            <li>
              <span className="font-semibold">Order history.</span> What you
              bought, when, what it cost, and where it went — including tracking
              and delivery status, which comes back to us from the fulfilment
              partner.
            </li>
            <li>
              <span className="font-semibold">Cart and session.</span> What is in
              your cart, the identifier that ties it to your browser, the token
              that keeps you signed in, and your locale and region choices. All
              carried in cookies — the table below lists them by name.
            </li>
            <li>
              <span className="font-semibold">Oracle conversations.</span> The
              messages you send to the Oracle, the replies it gives, and a
              profile we build from them (see{" "}
              <em>The Oracle, and what it infers</em> below).
            </li>
            <li>
              <span className="font-semibold">Analytics events.</span> Pages
              viewed, buttons used, device and browser type, referring page, and
              an approximate location derived from your IP address. Used to see
              which parts of the shop are confusing.
            </li>
            <li>
              <span className="font-semibold">Support correspondence.</span>{" "}
              Emails you send us, and our replies.
            </li>
          </ul>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            We never see your card number. It goes straight to Stripe and stays
            there; we receive only the last four digits, the brand, and whether
            the charge succeeded.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-muted">
            If you give us someone else’s details — a gift sent to a friend, for
            instance — please make sure they are happy for you to hand them over.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Why we hold it, and on what legal ground
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Every purpose below has a lawful basis under GDPR Article 6. We do
            not process personal data without one, and we do not quietly use
            data for a purpose that is not listed here.
          </p>
          <div className="specimen-card my-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left font-humanist text-sm">
              <caption className="sr-only">
                Purposes of processing, the data involved, and the lawful basis
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    What we do
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Data involved
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Lawful basis
                  </th>
                </tr>
              </thead>
              <tbody className="text-paper-text">
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Create your account and sign you in
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Email, password hash, optional phone
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract — Art. 6(1)(b)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Send one-time SMS sign-in codes
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Phone number, code issue time
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract — you asked for this way of signing in
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Take payment and screen for fraud
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Name, email, billing address, order total, IP address
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract; legitimate interests for fraud prevention
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Pack and ship your order
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Name, shipping address, phone for the carrier, order contents
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract — Art. 6(1)(b)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Send order emails — receipt, dispatch, delivery
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Email address, order details
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Handle returns, refunds, and chargebacks
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Order history, correspondence, refund records
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract; legal obligation for accounting records
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Keep tax and accounting records
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Invoices, amounts, addresses, dates
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Legal obligation — Art. 6(1)(c)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Run Oracle conversations
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Messages you send, replies, your account identifier
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract — the Oracle is a members-only feature you ask for
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Keep the profile built from those conversations
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Extracted preferences and interests, not the transcript
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Legitimate interests — so a later reading picks up where the
                    last one stopped. [FILL: confirm this is the basis we will
                    defend, and record the assessment]
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Answer product searches
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Search terms; catalogue text
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Contract; legitimate interests for running the shop’s search
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Measure and improve the shop
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Pages viewed, events, device, browser, IP-derived location
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Consent for non-essential cookies in the EU/UK; legitimate
                    interests for aggregate measurement elsewhere
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Keep the shop secure and stop abuse
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Session data, IP address, request logs, rate-limit counters
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Legitimate interests — Art. 6(1)(f)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Send marketing email, if we ever do
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Email address, order history
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Consent only — Art. 6(1)(a). we do not send marketing email
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Establish or defend a legal claim
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Whatever the claim requires
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Legitimate interests; legal obligation
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Where we lean on legitimate interests we have weighed our need
            against yours and written the reasoning down [FILL: confirm the
            assessment exists and where it is kept]. You can object to that
            processing at any time, and we will stop unless we have a compelling
            reason to continue.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Where we rely on consent, you can withdraw it as easily as you gave
            it. Withdrawal stops the processing from that point; it does not
            undo what happened while consent was in place.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Cookies
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Cookies are small files the shop leaves in your browser. We use a
            handful, and only these.
          </p>
          <div className="specimen-card my-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left font-humanist text-sm">
              <caption className="sr-only">
                Cookies set by the shop, what each does, and how long it lasts
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Cookie
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    What it does
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Lasts
                  </th>
                </tr>
              </thead>
              <tbody className="text-paper-text">
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    <code className="font-mono text-xs">_medusa_cart_id</code>
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Keeps your cart attached to your browser between pages
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Strictly necessary
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    7 days
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    <code className="font-mono text-xs">_medusa_jwt</code>
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Keeps you signed in; holds a signed session token, not your
                    password
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Strictly necessary
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    7 days
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    <code className="font-mono text-xs">_medusa_cache_id</code>
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Lets served pages be cached per visitor so one person’s cart
                    never appears in another’s page
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Strictly necessary
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    24 hours
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    <code className="font-mono text-xs">_medusa_locale</code>
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Remembers the language and region you chose
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Functional / preference
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    1 year
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    <code className="font-mono text-xs">ph_*</code> (PostHog)
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Tells us, anonymously where possible, which pages and
                    features get used
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Analytics — set only if you accept
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    up to 1 year, only after you accept analytics
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            The first four are set without asking, because sign-in and checkout
            do not work without them. Analytics cookies are set only if you
            accept them in the consent banner — declining, or never answering,
            means no analytics runs at all. We do not use advertising cookies,
            cross-site tracking, or advertising profiles.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-muted">
            You can block or delete cookies in your browser. Blocking the
            strictly necessary ones will break signing in and checking out.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Who else sees your data
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We are a small shop and we do not run our own infrastructure. The
            companies below process data on our instructions, under written
            contracts that limit them to that job.
          </p>
          <div className="specimen-card my-6 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left font-humanist text-sm">
              <caption className="sr-only">
                Processors, what they do, what they receive, and where they are
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Processor
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    What they do
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    What they receive
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Where
                  </th>
                </tr>
              </thead>
              <tbody className="text-paper-text">
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Stripe
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Takes payment, issues receipts, screens for card fraud
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Name, email, billing address, order total, IP address; card
                    details go to Stripe directly
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    United States and Ireland [FILL: confirm the contracting
                    entity and data region]
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    CJ Dropshipping
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Fulfils and dispatches your order
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Recipient name, shipping address, phone where the carrier
                    needs it, order contents
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    China, with warehouses outside the United States and the EU
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    SMTP
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Delivers transactional email — receipts, dispatch notices,
                    password resets
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Email address, the contents of the message
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    the email provider's servers
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Twilio
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Delivers SMS one-time sign-in codes
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Phone number, the code message
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    United States
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    PostHog
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Product analytics — which pages and features are used
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Events, pages, browser and device, IP-derived location, a
                    pseudonymous identifier
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    United States (US Cloud)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Hostinger
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Hosts the virtual server that runs the shop, its Postgres
                    database, and Redis
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Everything the database holds — account, order, and Oracle
                    data
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    the United States (Phoenix)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Vercel
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Serves the shop’s pages and images
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    The requests that reach the site — pages viewed, browser and
                    device, IP address
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    the United States (global delivery network)
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Sentry
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Error monitoring — records what broke so it can be fixed
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Error messages, stack traces, the page you were on, and
                    technical request details
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    the United States
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    DeepSeek
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Runs the Oracle’s language model, and the extraction step that
                    turns a conversation into a profile
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    The text of your Oracle messages and the replies; we do not
                    send your address or payment data
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    China
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Voyage AI
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Embeds catalogue text so search can match meaning, not just
                    spelling
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Product catalogue text the search terms you type, embedded to answer that search
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    United States
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Beyond those, we share data only: with professional advisers, such as
            an accountant, who are bound by their own duties of confidence; with
            a court or law-enforcement body where the law actually requires it;
            and with a buyer, in the unlikely event the business is sold — in
            which case your data would move with it and you would be told before
            anything changed.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">
              We do not sell your personal data.
            </strong>{" "}
            We do not hand it to data brokers, and we do not share it for
            cross-context behavioural advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The Oracle, and what it infers
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            The Oracle is a member-only conversation counter. It is the one place
            on this site where we do something that deserves its own paragraph
            rather than a table row, because it involves inference — and inference
            is where privacy gets interesting.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">What happens.</strong> You write a
            message. We send it to a language model, which writes back. Your
            conversation is saved to your account so the next reading can pick up
            where the last one stopped. Separately, a second pass distils the
            conversation into a short profile — the kinds of things you are
            drawn to, what you asked about, what you dismissed — and stores that
            in our database alongside your account.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">Why we are telling you this.</strong>{" "}
            A profile built by a machine, kept across sessions, is profiling in
            the legal sense. It can be wrong. It can record an impression rather
            than a fact, and it may draw a conclusion you never stated. You have
            the right to see it, correct it, object to it, or have it erased, and
            you can do that without giving a reason.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">What the Oracle does not do.</strong>{" "}
            It does not decide whether you get an account, a price, a discount,
            or a delivery. No automated decision here has a legal effect on you or
            otherwise affects you significantly. A person — the owner — is
            reachable for anything the Oracle says.
          </p>
          <div className="specimen-card mt-6 max-w-2xl border-paper-accent bg-paper-surface p-6 small:p-7">
            <p className="font-display text-xl leading-snug text-paper-accent">
              Please do not type health or belief information into the Oracle
            </p>
            <p className="mt-3 font-humanist text-[15px] leading-7 text-paper-muted">
              That means symptoms, diagnoses, pregnancy, medication, mental-health
              crises, disability, or details of religious and spiritual belief.
              The same goes for ethnicity, sexual orientation, political views,
              union membership, genetic or biometric data, and any government
              identifier.
            </p>
            <p className="mt-3 font-humanist text-[15px] leading-7 text-paper-muted">
              We ask for two reasons. The law treats that information as a special
              category requiring an explicit legal basis, which we do not have for
              a chat feature — so we cannot lawfully collect it, however kindly it
              is meant. And once it leaves our server for a model provider, we
              cannot promise to reach every copy of it on request.
            </p>
            <p className="mt-3 font-humanist text-[15px] leading-7 text-paper-muted">
              The Oracle is not a doctor, therapist, lawyer, financial adviser, or
              emergency service. If you are in crisis, please contact a local
              emergency number rather than this shop.
            </p>
          </div>
          <p className="mt-6 font-humanist text-[15px] leading-7 text-paper-text">
            We instruct the model not to solicit that kind of detail. If it
            surfaces anyway, we delete what we can [FILL: describe the deletion
            process and who performs it]. If you have already sent something you
            regret, write to support@3rdeyesupply.com and we will remove the
            conversation and any profile drawn from it.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Because this is profiling at scale, GDPR Article 35 requires a data
            protection impact assessment before the feature runs. Status: not yet started. A transfer
            impact assessment covering the China transfer is outstanding.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Sending data outside your country
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We are a US business and most of our systems sit in the United States.
            If you are in the EU, the UK, or Switzerland, that means your data
            crosses a border. We rely on the European Commission’s Standard
            Contractual Clauses, and where a processor is certified, on the
            EU–US Data Privacy Framework [FILL: confirm which mechanism applies to
            each processor]. The UK addendum applies to UK data [FILL: confirm].
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">
              A specific caveat about the Oracle.
            </strong>{" "}
            The Oracle’s language model provider, DeepSeek, processes data in
            China. There is no adequacy decision for China. The transfer rests on
            the Standard Contractual Clauses plus a documented transfer impact
            assessment outstanding.
            Chinese law — including its national security and intelligence
            legislation — can permit public authorities to require access to data
            held in China, which is a risk we cannot contract away. We limit it by
            sending only the conversation itself, never your address, phone, or
            payment details, and by encrypting the link in transit.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-muted">
            If that trade-off is not one you want to make, simply do not use the
            Oracle. Browsing, ordering, and everything else on this site work
            without it. You can also ask us for a copy of the safeguards we rely
            on for any processor, at support@3rdeyesupply.com.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            How long we keep it
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We keep things for as long as we need them and no longer. Where a law
            forces us to hold records — tax and accounting, mostly — that period
            wins.
          </p>
          <div className="specimen-card my-6 overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-left font-humanist text-sm">
              <caption className="sr-only">
                Retention periods by category of data
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Data
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Kept for
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Why
                  </th>
                </tr>
              </thead>
              <tbody className="text-paper-text">
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Account — email, password hash, phone
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Until you close it, then [FILL: period]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    You are still signed in and can still reorder
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Addresses
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: period]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Saved for repeat orders
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Order and invoice records
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: the statutory tax/accounting period that applies]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Legal obligation
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Cart and session cookies
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    up to 7 days
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Keep your basket and your sign-in working
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Oracle conversations
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: period, or “until you delete them”]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    So you can return to a reading
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Oracle profile
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: period, and whether it is rebuilt or decayed]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Continuity between conversations
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Analytics events
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    the PostHog project default
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Seeing what is broken
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Support email
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: period]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Resolving what you asked about
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Backups
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: rotation period]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    Recovering from a failure
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Your rights — EU, EEA, UK, and Switzerland
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <span className="font-semibold">Access.</span> A copy of the
              personal data we hold about you, and an explanation of what we do
              with it.
            </li>
            <li>
              <span className="font-semibold">Correction.</span> Fix anything
              wrong, including an Oracle profile that has misread you.
            </li>
            <li>
              <span className="font-semibold">Erasure.</span> Ask us to delete it,
              where no legal duty requires us to keep it.
            </li>
            <li>
              <span className="font-semibold">Restriction.</span> Freeze the
              processing while a dispute about accuracy or lawfulness is settled.
            </li>
            <li>
              <span className="font-semibold">Portability.</span> Take the data you
              gave us — in a structured, machine-readable form — and move it
              elsewhere.
            </li>
            <li>
              <span className="font-semibold">Objection.</span> Object to
              processing based on legitimate interests, including the Oracle
              profile, and to direct marketing at any time.
            </li>
            <li>
              <span className="font-semibold">Automated decisions.</span> Not to be
              subject to a decision based solely on automated processing that has
              a legal or similarly significant effect. We do not make one.
            </li>
            <li>
              <span className="font-semibold">Withdraw consent.</span> Where we
              rely on consent, take it back whenever you like.
            </li>
          </ul>
          <p className="mt-5 font-humanist text-[15px] leading-7 text-paper-text">
            Write to support@3rdeyesupply.com and say what you want. We answer
            within one month. If a request is genuinely complex we may extend that
            by two further months and will tell you why before the first month is
            up. Requests are free. If we cannot be confident who is asking, we may
            ask you to verify — proportionate to what is at stake, and never more
            than we need.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            If we get it wrong, you can complain to your local supervisory
            authority. [FILL: identify the lead supervisory authority and add its
            contact, or note that the competent authority is the one in the
            complainant’s own member state]. We would rather you told us first, but
            you do not have to.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Your rights — California
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            If you live in California, the CCPA as amended by the CPRA gives you
            the following. We extend them to any US customer who asks, because it
            is easier than working out where the line falls.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <span className="font-semibold">To know.</span> The categories and
              specific pieces of personal information we have collected, the
              sources, the purposes, and the categories of third parties we
              disclosed it to.
            </li>
            <li>
              <span className="font-semibold">To delete.</span> Deletion of the
              personal information we have collected from you, subject to the
              exceptions the statute allows — an unfinished order or a tax record,
              for instance.
            </li>
            <li>
              <span className="font-semibold">To correct.</span> Correction of
              inaccurate personal information.
            </li>
            <li>
              <span className="font-semibold">To opt out of sale or sharing.</span>{" "}
              We do not sell personal information and we do not share it for
              cross-context behavioural advertising, so there is nothing to opt
              out of. We honour Global Privacy Control as a signal all the same.
            </li>
            <li>
              <span className="font-semibold">
                To limit use of sensitive personal information.
              </span>{" "}
              The sensitive information we hold is your account login, which we use
              only to keep your account secure — a purpose the statute permits.
            </li>
            <li>
              <span className="font-semibold">Not to be discriminated against.</span>{" "}
              Exercising any of these rights will not change your prices, your
              service, or the quality of what you get.
            </li>
          </ul>
          <p className="mt-5 font-humanist text-[15px] leading-7 text-paper-text">
            Ask at support@3rdeyesupply.com. We respond within
            45 days, and may extend once by a further 45 with notice. An authorised
            agent may ask on your behalf, with written permission we can check.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-muted">
            Nevada residents: we do not sell covered information as Nevada law
            defines it, so there is no opt-out to exercise.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            How we protect it
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              Traffic to and from the shop is encrypted in transit with TLS.
            </li>
            <li>
              Passwords are hashed, never stored in readable form, and never
              emailed to you.
            </li>
            <li>
              The database lives on a private server, reachable over the network
              only from the application [FILL: confirm firewall and access
              configuration].
            </li>
            <li>
              Access to production systems is limited to the owner [FILL: add any
              contractor or helper with access].
            </li>
            <li>
              Disk-level encryption on the server: [FILL: confirm enabled].
            </li>
            <li>
              Backups are taken [FILL: frequency] and kept [FILL: period].
            </li>
            <li>
              Software and dependencies are updated [FILL: cadence].
            </li>
          </ul>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            No system is perfect, and we will not pretend otherwise. If a breach
            happens that is likely to put your rights at risk, we notify the
            supervisory authority within 72 hours of becoming aware of it, and we
            tell you directly, without undue delay, if the risk to you is high.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-muted">
            We will never ask for your password by email. If a message claims to be
            from us and does, it is not.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Children
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            The shop is for adults. We do not knowingly collect personal data from
            anyone under 16 in the EU or under 13 in the United States, and we do
            not direct the Oracle at children. If you believe a child has given us
            information, write to support@3rdeyesupply.com and we will delete
            the account and its data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Changes to this policy
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            When our practice changes, this page changes with it, and the date at
            the top moves. If a change materially affects you — a new purpose, a
            new processor outside the US or EU, a longer retention period — we will
            say so on the site and by email to account holders [FILL: notice period
            before the change takes effect].
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Contact
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            One person reads these, so please be direct and we will be too.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              Privacy and data requests: support@3rdeyesupply.com
            </li>
            <li>General support: support@3rdeyesupply.com</li>
            <li>
              Post: 3rd Eye Supply, [FILL: street address], Las Vegas, Nevada
              [FILL: ZIP], United States
            </li>
          </ul>
          <div className="paper-hairline my-10" aria-hidden="true" />
          <p className="font-humanist text-sm leading-7 text-paper-muted">
            If any part of this policy conflicts with the law where you live, the
            law wins and this policy is read down to match it. Nothing here takes
            away a right the law gives you.
          </p>
        </section>
      </div>
    </div>
  )
}
