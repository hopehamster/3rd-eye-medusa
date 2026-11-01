import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact | 3rd Eye Supply",
  description:
    "How to reach 3rd Eye Supply — the email route for orders, returns and data requests, what to include, our postal address, and when to expect a reply.",
}

// NOTE: every [FILL: ...] below is a fact that must be confirmed and written
// out before this page is published. Nothing here should be invented to fill a
// gap — a contact route nobody answers is worse than no page at all.

export default async function ContactPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Contact
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            3rd Eye Supply is a sole proprietorship run out of Las Vegas, not a
            call centre. Everything below reaches the person who answers for the
            shop, so a clear message gets a useful reply.
          </p>
          <p className="mt-6 font-humanist text-xs uppercase tracking-widest text-paper-muted">
            Last updated: 31 October 2026 &middot; Effective: 31 October 2026
          </p>
        </header>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The one route: email
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">support@3rdeyesupply.com</strong>
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Orders, returns, damaged parcels, payment questions and data requests
            all go there. It is the only support channel we run, and it keeps a
            written record of every return and dispute — which protects you as
            much as it protects us.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Put the subject line to work. It is how messages get sorted:
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">Order #1234 — question.</strong>{" "}
              Anything about an order you have already placed.
            </li>
            <li>
              <strong className="font-semibold">Order #1234 — damaged.</strong>{" "}
              Anything that arrived broken, wrong or incomplete.
            </li>
            <li>
              <strong className="font-semibold">Return request.</strong> Before you
              post anything back.
            </li>
            <li>
              <strong className="font-semibold">Data request.</strong> Anything
              about the personal data we hold on you.
            </li>
            <li>
              <strong className="font-semibold">The Oracle.</strong> Access,
              limits, or a reading that went wrong.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            What to put in the message
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              Your order number if there is one, and the email address you used at
              checkout. The two together let us find the order without a round
              trip.
            </li>
            <li>
              What happened, in the order it happened, with dates where you have
              them.
            </li>
            <li>
              For a damaged or missing item, photographs of the item, the
              packaging and the shipping label. A picture of the label is often
              the whole case for a carrier claim.
            </li>
            <li>
              What you would like — a refund, a replacement, a different address,
              an answer. It saves a step if we know what outcome you are after.
            </li>
          </ul>
          <p className="mt-5 font-humanist text-[15px] leading-7 text-paper-text">
            Please do not send card numbers, passwords or identity documents. We
            never need them, and email is not a safe place for them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            When to expect a reply
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We aim to answer within{" "}
            <strong className="font-semibold">[FILL: response time]</strong> on
            business days, Monday to Friday, excluding US public holidays.
            Messages are answered in the order they arrive. Weekends and holidays
            queue up behind each other, so a Monday morning backlog is normal and
            is not a sign that nothing is happening.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Some things genuinely take longer, and we will say so when they do:
            carrier traces, customs enquiries, and supplier investigations into a
            missing parcel. We will give you a date by which we expect to know
            more, rather than leave you guessing.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            If our stated window has passed and you have heard nothing, send a
            follow-up on the same thread. That is not rude, and it will not push
            you to the back of anything — it moves a message that has sunk.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Post, and notices
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            For anything that has to go by post — a statutory notice, a formal
            complaint, or a return we have authorised — the address is{" "}
            <strong className="font-semibold">[FILL: business address]</strong>.
            That is the address for service on [FILL: registered business name],
            trading as 3rd Eye Supply, a sole proprietorship in Las Vegas, Nevada.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Please do not post a return until we have replied. Unannounced
            parcels, and parcels sent to the address printed on the shipping
            label — that is the supplier&rsquo;s warehouse, often overseas — will
            not reach us. Returns &amp; Refunds sets out the sequence.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            EU responsible person
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            For products placed on the European Union market, the responsible
            economic operator established in the Union is{" "}
            <strong className="font-semibold">
              [FILL: EU responsible person — name and postal address]
            </strong>
            . They can be contacted about product safety matters, and their
            details appear on the product or its packaging where the rules
            require it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Payments and card disputes
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Cards are processed by Stripe, and the charge appears on your
            statement as{" "}
            <strong className="font-semibold">[FILL: statement descriptor]</strong>
            . If you see a charge you do not recognise, email us first with the
            date and the amount. A chargeback can take weeks to resolve and
            freezes the order in the meantime; we can usually identify a charge in
            one email and, if something has gone wrong, refund it directly.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Before you write
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Three pages answer most of what lands in the inbox. Shipping &amp;
            Delivery covers dispatch times, delivery estimates, split parcels,
            tracking that has gone quiet, and who pays import VAT and duty.
            Returns &amp; Refunds covers the window, return postage, hygiene
            exclusions and the EU right of withdrawal. Terms of Sale covers the
            contract, what our metaphysical language does and does not claim, and
            the limits of the Oracle.
          </p>
        </section>
      </div>
    </div>
  )
}
