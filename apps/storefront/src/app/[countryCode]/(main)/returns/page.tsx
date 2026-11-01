import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Returns & Refunds | 3rd Eye Supply",
  description:
    "How to return something to 3rd Eye Supply — the window, who pays return postage, the hygiene and sealed-goods exclusions, and the EU fourteen-day right of withdrawal with its model form.",
}

// NOTE: every [FILL: ...] below is a fact that must be confirmed and written
// out before this page is published. Nothing here should be invented to fill a
// gap — the withdrawal form and the statutory text around it must stay exact.

export default async function ReturnsPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Returns &amp; Refunds
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            If a piece is not right, send it back. Below is the window, who pays
            the postage, what we cannot take back for hygiene reasons, and the
            statutory right EU customers have on top of all of it.
          </p>
          <p className="mt-6 font-humanist text-xs uppercase tracking-widest text-paper-muted">
            Last updated: 31 October 2026 &middot; Effective: 31 October 2026
          </p>
        </header>

        <section>
          <div className="specimen-card max-w-xl p-6 small:p-8">
            <p className="font-display text-xl text-paper-text">At a glance</p>
            <ul className="mt-4 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
              <li>
                <strong className="font-semibold">The window.</strong>{" "}
                [FILL: return window] days from delivery.
              </li>
              <li>
                <strong className="font-semibold">Return postage.</strong>{" "}
                [FILL: who pays return postage], unless the item arrived
                damaged, faulty or not as described.
              </li>
              <li>
                <strong className="font-semibold">Start here.</strong>{" "}
                support@3rdeyesupply.com, before you post anything.
              </li>
              <li>
                <strong className="font-semibold">EU withdrawal.</strong>{" "}
                Fourteen days from delivery, no reason needed.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The window
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            You have [FILL: return window] days from the day your parcel is
            delivered — or, where an order arrives in more than one parcel, from
            the day the last parcel arrives — to tell us you want to return
            something. Telling us inside the window is what counts; you do not
            have to get it into the post that day, but we ask you to send it
            within fourteen days of us agreeing to it.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            A return has to start with a message, not a parcel. Write to support@3rdeyesupply.com with your order number and what you want to return,
            and wait for our reply before posting anything.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            How to send something back
          </h2>
          <ol className="mt-5 list-decimal pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              Email support@3rdeyesupply.com with your order number, the items, and
              the reason — plus a photograph if anything is damaged.
            </li>
            <li>
              We reply with an authorisation and the return address, [FILL:
              return address].{" "}
              <strong className="font-semibold">
                Please do not post to the address printed on the parcel.
              </strong>{" "}
              That is the supplier&rsquo;s warehouse, often overseas, and a
              parcel sent there will not reach us and may be refused.
            </li>
            <li>
              Pack the item securely, in its original box or with equivalent
              padding where you still have it, and put the order number inside
              the parcel.
            </li>
            <li>
              Use a service with tracking. We cannot refund a return that never
              arrives, and without a tracking number there is nothing either of
              us can check.
            </li>
            <li>
              Send us the tracking number once you have it, so we can watch for it
              at the other end.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Who pays return postage
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            [FILL: who pays return postage] in the ordinary case — a change of
            mind, the wrong size chosen, a gift that did not land. You pay the
            carrier, and we do not reimburse that cost.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            When the return is our fault — the item arrived damaged, faulty, or
            is not what you ordered — we cover return postage and refund the
            original shipping as well. Say so when you write, and we will arrange
            it.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-muted">
            EU customers exercising the statutory right of withdrawal bear the
            direct cost of returning the goods, except where we have agreed
            otherwise or the goods are faulty. That is set out in full below.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Refunds
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We inspect a return when it reaches us, then refund to the card you
            paid with, through Stripe. We cannot refund to a different card, or in
            cash. Refunds are issued within fourteen days of our receiving the
            goods or, if sooner, of you showing us proof that you sent them back;
            in practice we usually process them within [FILL: refund processing
            time] of arrival.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            We refund the price you paid for the item, plus the standard shipping
            you were charged where the return is our fault or where you are
            exercising the EU right of withdrawal. If you chose a more expensive
            delivery option than our standard one, the difference is not
            refunded. We may reduce a refund where the item has been used, worn
            or handled beyond what is reasonable to inspect it.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            What we cannot take back
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">
                Pierced jewellery, once its hygiene seal is broken.
              </strong>{" "}
              Earrings, body jewellery, and anything designed to pass through the
              skin cannot be returned after the sealed packaging has been opened,
              for hygiene reasons. If it arrived damaged or is the wrong item, the
              fault exception below still applies.
            </li>
            <li>
              <strong className="font-semibold">
                Opened incense and consumables.
              </strong>{" "}
              Incense, loose resin, herbs and oils, once the seal is broken or
              once anything has been burnt, smelt or partly used.
            </li>
            <li>
              Items that have been used, worn, washed or altered — including
              apparel with removed tags, and stones or orgone pieces handled in a
              way that marks them.
            </li>
            <li>
              Personalised or made-to-order pieces, and anything cut, drilled,
              knotted or strung to your specification.
            </li>
            <li>
              Gift cards, and digital readings or downloads once delivered.
            </li>
            <li>
              Items marked final sale on the product page, where the listing said
              so before you bought.
            </li>
            <li>
              Parcels sent to us without authorisation, or sent to the address on
              the shipping label rather than the return address we gave you.
            </li>
          </ul>
          <p className="mt-5 font-humanist text-[15px] leading-7 text-paper-text">
            Natural variation is not a fault. Colour, veining, pattern, size and
            weight differ from piece to piece and from the photographs — that is
            the material. A piece that is genuinely not what was described is a
            different matter, and we will put it right.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Damaged, faulty, or the wrong item
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Message us within 72 hours of delivery with
            photographs of the item and the packaging, and we will sort out a
            replacement or a refund with return postage on us. Keep the packaging
            until we are done — carriers and customs sometimes ask to see it, and
            a photograph of the label is often all that is needed to open a claim.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            This sits alongside your statutory rights, not instead of them. A
            faulty item can always come back, whatever its condition, because the
            fault is ours to answer for.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The EU fourteen-day right of withdrawal
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            If you are a consumer in the European Union, you have a statutory
            right to withdraw from your purchase within{" "}
            <strong className="font-semibold">fourteen days</strong> without
            giving a reason. It is a legal right, it applies whether or not you
            are happy with the item, and it sits on top of everything else on this
            page.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">When it starts.</strong> The day
              you, or a third party you nominated other than the carrier,
              physically receive the goods. Where one order is delivered in
              several parcels, it starts on the day the last parcel arrives.
            </li>
            <li>
              <strong className="font-semibold">How to use it.</strong> Send us a
              clear statement that you are withdrawing — an email to support@3rdeyesupply.com is enough, or use the model form below. You do not
              need our permission and you do not need to give a reason.
            </li>
            <li>
              <strong className="font-semibold">Returning the goods.</strong>{" "}
              Send them back within fourteen days of telling us, to the return
              address we give you, using a tracked service. You bear the direct
              cost of return postage.
            </li>
            <li>
              <strong className="font-semibold">Handling.</strong> You may
              examine and try the goods as you would in a shop. You are liable for
              any diminished value caused by handling beyond that.
            </li>
            <li>
              <strong className="font-semibold">The refund.</strong> We reimburse
              everything you paid, including the standard delivery cost, within
              fourteen days of the day you tell us. We may hold the refund until
              we have the goods back, or until you show us proof of return —
              whichever comes first.
            </li>
            <li>
              <strong className="font-semibold">What it does not cover.</strong>{" "}
              Sealed goods unsealed after delivery where they are unsuitable for
              return on hygiene grounds — the pierced jewellery and opened incense
              cases above; goods made to your specification; and perishable
              items.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Model withdrawal form
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Optional. Use it if you prefer a form to an email — either is valid.
          </p>
          <div className="specimen-card my-6 p-6 small:p-8">
            <p className="font-humanist text-sm leading-6 text-paper-muted">
              Complete and return this form only if you wish to withdraw from the
              contract.
            </p>
            <div className="mt-5 space-y-4 font-humanist text-[15px] leading-7 text-paper-text">
              <p>
                To 3rd Eye Supply, [FILL: business address], support@3rdeyesupply.com:
              </p>
              <p>
                I/We (*) hereby give notice that I/We (*) withdraw from my/our (*)
                contract of sale of the following goods (*) / for the provision of
                the following service (*),
              </p>
              <p>Ordered on (*) / received on (*):</p>
              <p>Name of consumer(s):</p>
              <p>Address of consumer(s):</p>
              <p>
                Signature of consumer(s) (only if this form is notified on paper):
              </p>
              <p>Date:</p>
              <p className="text-sm text-paper-muted">(*) Delete as appropriate.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Where else to look
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Shipping &amp; Delivery covers parcels that arrive late, damaged or
            held at customs. Terms of Sale covers the contract and the limits of
            our metaphysical language. The Contact page has the route and our
            response times.
          </p>
        </section>
      </div>
    </div>
  )
}
