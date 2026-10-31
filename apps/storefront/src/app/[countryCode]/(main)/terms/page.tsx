import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Sale | 3rd Eye Supply",
  description:
    "The terms that apply when you order from 3rd Eye Supply — when the contract forms, who actually ships your parcel, prices and tax, and what our metaphysical language does and does not claim.",
}

// NOTE: every [FILL: ...] below is a fact that must be confirmed and written
// out before this page is published. Nothing here should be invented to fill a
// gap — an inaccurate term is worse than a missing detail.

export default async function TermsPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Terms of Sale
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            What you agree to when you order from 3rd Eye Supply, written out
            plainly. Where the law needs precision, we have been precise; where
            something is still to be confirmed, it is marked rather than guessed.
          </p>
          <p className="mt-6 font-humanist text-xs uppercase tracking-widest text-paper-muted">
            Last updated: [FILL: date] &middot; Effective: [FILL: date]
          </p>
        </header>

        <section>
          <div className="specimen-card max-w-xl p-6 small:p-8">
            <p className="font-display text-xl text-paper-text">
              The short version
            </p>
            <ul className="mt-4 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
              <li>
                Your contract with us forms when we confirm dispatch — not when
                you pay.
              </li>
              <li>
                Your parcel is shipped by a third-party supplier. It may not
                carry our branding, and it may arrive in more than one piece.
              </li>
              <li>
                Import VAT and duty on EU deliveries are yours unless checkout
                collects them.
              </li>
              <li>
                Crystals and ritual language are culture and reflection, not
                medicine. We make no medical claims.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Who we are
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            3rd Eye Supply is the trading name of [FILL: registered business
            name], a sole proprietorship based in Las Vegas, Nevada, in the
            United States. We sell metaphysical goods — crystals, stone
            jewellery, orgone pieces, incense and apparel — to customers in the
            United States and the European Union.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Our postal address is [FILL: business address] and our support email
            is [FILL: support email]. Either is the address for a notice under
            these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            When the contract forms
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Placing an order is an offer to buy. We accept that offer, and a
            contract comes into existence between us,{" "}
            <strong className="font-semibold">
              only when we send you a dispatch confirmation
            </strong>
            . The email you receive at checkout is an automatic acknowledgement
            that your order reached us. It is not acceptance, and nothing has
            been bought or sold until dispatch is confirmed.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Before dispatch we may decline or cancel an order — if an item turns
            out to be unavailable from our supplier, if a price or description
            was plainly wrong, if we cannot deliver to the address you gave us,
            or if we suspect fraud. If that happens we cancel in full and refund
            everything you paid, and neither of us owes the other anything more
            than that.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            If you need to change or cancel, write to [FILL: support email] as
            quickly as you can. Before dispatch we can usually manage it. Once a
            parcel is dispatched it belongs to the returns process, not the
            cancellation one.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Who actually ships your order
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We do not hold stock. Orders are passed to a third-party supplier,
            CJ Dropshipping, which packs and ships directly to you from its own
            warehouses. A few things follow from that, and you should know them
            before you order:
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>Your parcel is packed and dispatched by the supplier, not by us.</li>
            <li>
              Items in one order can come from different warehouses. They may
              arrive as more than one parcel, on different days, with separate
              tracking numbers.
            </li>
            <li>
              Packaging is the supplier&rsquo;s. It may not carry our name or
              branding, and it may include the supplier&rsquo;s own paperwork or
              inserts. Plain or unfamiliar packaging is normal and is not by
              itself a sign that something is wrong.
            </li>
            <li>
              Stock levels, dispatch speed and carrier choice are the
              supplier&rsquo;s. We pass on what they tell us, and we chase them
              when it goes wrong.
            </li>
          </ul>
          <p className="mt-5 font-humanist text-[15px] leading-7 text-paper-text">
            None of this changes who you are dealing with.{" "}
            <strong className="font-semibold">
              Your contract is with us
            </strong>{" "}
            — [FILL: registered business name], trading as 3rd Eye Supply — not
            with the supplier. Complaints, returns, refunds and your statutory
            rights are ours to handle. Please contact us rather than the
            supplier, so there is one record and one responsible party behind it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Prices, currency and tax
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">Currency.</strong> Prices are
              shown in [FILL: currency]. Shipping is calculated separately and
              shown at checkout before you pay.
            </li>
            <li>
              <strong className="font-semibold">Cards.</strong> Payments are
              processed by Stripe. We never see or store your full card number.
            </li>
            <li>
              <strong className="font-semibold">Statement descriptor.</strong>{" "}
              The charge appears on your card statement as [FILL: statement
              descriptor]. If you do not recognise it, email us before raising a
              dispute with your bank — it is almost always faster.
            </li>
            <li>
              <strong className="font-semibold">Conversion.</strong> If your card
              is held in another currency, Stripe or your bank may convert the
              amount and may add a fee. That fee is theirs, not ours.
            </li>
            <li>
              <strong className="font-semibold">Tax we collect.</strong> Sales
              tax or VAT is added at checkout where we are required to collect
              it, and is itemised before you pay.
            </li>
            <li>
              <strong className="font-semibold">Tax we do not collect.</strong>{" "}
              Where tax is not collected at checkout — import VAT and duty on EU
              deliveries, for example — you are the importer of record for your
              parcel and responsible for the charges raised on arrival. The
              Shipping &amp; Delivery page explains how that works in practice.
            </li>
            <li>
              <strong className="font-semibold">Changes.</strong> We can change
              prices at any time, but never after we have confirmed dispatch of
              your order.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Natural materials, and the limits of our language
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Much of what we sell is natural, hand-finished or made in small
            batches. Colour, pattern, size, weight and veining vary from piece to
            piece and from the photographs, and stones can carry pits, inclusions
            and asymmetry. That variation is the material, not a fault. A piece
            that is genuinely not what you ordered — wrong item, wrong size,
            damaged in transit — is a different matter, and the Returns &amp;
            Refunds page covers it.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            We write about crystals, stones, orgone and incense in the language
            of intention, resonance, energy and ritual. That language is cultural
            and personal. It is not a statement of scientific fact, and it is not
            a promise of any outcome — not health, not wealth, not luck, not
            love, not protection from harm.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            <strong className="font-semibold">What we do not claim.</strong>
          </p>
          <ul className="mt-4 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              Nothing we sell is a medical device, a medicine or a treatment.
            </li>
            <li>
              We do not claim that any product can diagnose, treat, cure or
              prevent any disease or condition.
            </li>
            <li>
              Nothing on this site, in our guides, or in the Oracle is medical,
              psychological, legal or financial advice, and none of it replaces
              care from a qualified professional you have actually consulted.
            </li>
            <li>
              If you have a health concern, see a doctor. If you are pregnant,
              nursing or being treated for a condition, ask your clinician before
              using anything new.
            </li>
            <li>
              Metaphysical goods are sold for reflection, ritual, decoration and
              enjoyment — not for a result we have promised you.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Using what you buy safely
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            These are ordinary precautions, not admissions that a product does
            anything in particular:
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              Do not ingest stones, crystals, resins, ash or loose herbs, and do
              not use stones in water you intend to drink or on broken skin.
            </li>
            <li>
              Keep small pieces, and anything on a cord or chain, away from
              children and pets. They are choking and strangulation hazards, not
              toys.
            </li>
            <li>
              Burn incense and loose resins in or on a heat-proof holder, in a
              ventilated room, away from curtains, drafts and anything else that
              will catch — and never leave them burning unattended.
            </li>
            <li>
              Orgone pieces contain metal and resin. Do not dismantle them and do
              not expose them to high heat. They are not toys or electrical
              devices.
            </li>
            <li>
              Plated and base-metal jewellery can tarnish or react with skin.
              Keep it dry, and stop wearing it if your skin reacts.
            </li>
            <li>Follow any care card or label that arrives with an item.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The Oracle
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            The Oracle is a members-only AI chat. It is a language model — not a
            person, not a reader, and not an authority. It is a tool for thinking
            out loud about ritual, stones and practice, and we would rather tell
            you its limits than have you find them yourself.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">It can be wrong.</strong> It can
              be confidently wrong, too. It may misremember a stone, a tradition,
              or one of our products.
            </li>
            <li>
              <strong className="font-semibold">It does not know you.</strong>{" "}
              Its answers are not medical, psychological, legal or financial
              advice, and should not be relied on for anything with real
              consequences — health, money, safety or somebody else&rsquo;s
              wellbeing.
            </li>
            <li>
              <strong className="font-semibold">It sells.</strong> When the
              Oracle mentions a product, that is a commercial suggestion from our
              own shop: not impartial advice, and not a guarantee that the item
              will do anything for you.
            </li>
            <li>
              <strong className="font-semibold">It is not always on.</strong>{" "}
              Availability is not guaranteed. We apply usage limits, and we may
              change the model, change the cap, or withdraw the feature. An
              outage never affects an order you have placed.
            </li>
            <li>
              <strong className="font-semibold">It is not private in the way a
              diary is.</strong> Do not put sensitive information into a reading
              — health details, financial details, government identifiers,
              passwords — and do not submit other people&rsquo;s personal
              information.
            </li>
            <li>
              <strong className="font-semibold">Readings are saved.</strong> They
              are stored with your account so you can return to them, and we may
              review them to improve the feature, for safety, and to enforce
              these terms. Write nothing you would not want a member of our small
              team to read.
            </li>
            <li>
              <strong className="font-semibold">We can switch it off.</strong> We
              may suspend Oracle access for misuse: attempts to break or bypass
              it, use of it to produce professional advice for others, or use of
              it to generate unlawful or harmful content.
            </li>
            <li>
              <strong className="font-semibold">It changes nothing here.</strong>{" "}
              Nothing the Oracle says alters these terms or creates a warranty
              about a product.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Delivery, risk and title
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Delivery estimates are estimates, not commitments — carrier networks
            and customs clearance are outside our control, and no date we give is
            a guaranteed date. Risk in the goods passes to you when they are
            delivered to the address you gave us. Title passes when we have
            received payment in full.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Dispatch time and delivery time are separate things, and the Shipping
            &amp; Delivery page sets out both, along with what happens when a
            parcel is split, held, or charged at the border.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Returns, refunds and the EU right to withdraw
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Our return window, who pays return postage, and the exclusions are set
            out on the Returns &amp; Refunds page, which forms part of these
            terms. Consumers in the European Union also have a statutory
            fourteen-day right to withdraw from a distance contract without
            giving a reason; the conditions and the model withdrawal form are on
            that same page.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Your statutory rights
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Nothing in these terms removes a right the law gives you and that we
            are not allowed to exclude. That includes, in the United States, the
            state-law implied warranties of merchantability and fitness for a
            particular purpose where they cannot be waived, and, for EU
            consumers, your rights to conformity and to a remedy — repair,
            replacement, price reduction or termination — where goods are faulty
            or not as described. If these terms and the law conflict, the law
            wins and these terms bend to it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Our liability
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We do not limit liability that cannot lawfully be limited — including
            liability for death or personal injury caused by our negligence, for
            fraud, and for your non-excludable statutory rights. Subject to that,
            our total liability arising from an order is limited to the amount
            you paid us for it, and we are not liable for indirect or
            consequential losses such as lost profit, lost opportunity or loss of
            reputation.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Using our site
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            The text, photography, guides and design on this site are ours, and
            are for your personal use. Do not scrape the site at scale, attempt
            to bypass authentication or usage limits, copy our catalogue to run a
            competing shop, or present our guidance or the Oracle&rsquo;s answers
            as professional advice to others. We may suspend an account that
            does.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Changes to these terms
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We may update these terms as the shop, the law or our supplier
            arrangements change. The version that applies to your order is the
            one published when you placed it, and we will not apply a change
            retrospectively to an order already confirmed.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Governing law and where disputes go
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            These terms are governed by the laws of the State of Nevada, United
            States, without regard to its conflict-of-laws rules, and the state
            and federal courts sitting in Clark County, Nevada have jurisdiction
            over any dispute — subject to the next paragraph.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            If you are a consumer resident elsewhere, this does not deprive you
            of the protection of mandatory rules in your own country, and you may
            bring proceedings in the courts of your place of residence. Nothing
            here stops you using a consumer body, ombudsman or small-claims
            procedure that is open to you.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Before anything formal, please write to [FILL: support email]. Most
            problems are a parcel update and two emails away from being solved.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Getting in touch
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            The Contact page has the route, what to include in a message, and how
            long a reply takes. Shipping &amp; Delivery covers dispatch, transit
            and import charges. Returns &amp; Refunds covers sending something
            back, the exclusions, and the EU withdrawal right.
          </p>
        </section>
      </div>
    </div>
  )
}
