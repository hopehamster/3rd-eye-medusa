import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping & Delivery | 3rd Eye Supply",
  description:
    "How 3rd Eye Supply parcels are dispatched and delivered — dispatch time versus delivery estimate, split parcels and supplier packaging, tracking, and who pays EU import VAT and duty.",
}

// NOTE: every [FILL: ...] below is a fact that must be confirmed and written
// out before this page is published. Nothing here should be invented to fill a
// gap — a delivery promise we cannot keep is worse than no promise.

export default async function ShippingPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            Shipping &amp; Delivery
          </h1>
          <p className="font-humanist text-paper-muted leading-7">
            Your order is packed and sent by our supplier, not from a shelf in
            Las Vegas. That shapes everything below — how long dispatch takes,
            why one order can arrive in two parcels, and who collects import
            charges at the border.
          </p>
          <p className="mt-6 font-humanist text-xs uppercase tracking-widest text-paper-muted">
            Last updated: [FILL: date] &middot; Effective: [FILL: date]
          </p>
        </header>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Dispatch is not delivery
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            These are two different clocks, and we quote them separately.{" "}
            <strong className="font-semibold">Dispatch time</strong> is how long
            the supplier takes to pick, pack and hand your parcel to a carrier
            after we pass the order on.{" "}
            <strong className="font-semibold">Delivery time</strong> is how long
            the carrier then takes to reach you, and it starts only once the
            parcel is actually moving.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Our dispatch confirmation email is the moment the second clock
            starts. Until it arrives, your order has not been accepted and
            nothing has left a warehouse.
          </p>
          <div className="specimen-card my-6 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left font-humanist text-sm">
              <caption className="sr-only">
                Time to dispatch and time in transit, by destination
              </caption>
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Where it is going
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    Time to dispatch
                  </th>
                  <th
                    scope="col"
                    className="border-b border-paper-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-paper-muted"
                  >
                    In transit after dispatch
                  </th>
                </tr>
              </thead>
              <tbody className="text-paper-text">
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    United States
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: dispatch time]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: US delivery estimate]
                  </td>
                </tr>
                <tr>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    European Union
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: dispatch time]
                  </td>
                  <td className="border-b border-paper-borderSoft px-4 py-3 align-top leading-6">
                    [FILL: EU delivery estimate]
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 align-top leading-6">Elsewhere</td>
                  <td className="px-4 py-3 align-top leading-6">
                    [FILL: dispatch time]
                  </td>
                  <td className="px-4 py-3 align-top leading-6">
                    [FILL: rest-of-world delivery estimate]
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="font-humanist text-[15px] leading-7 text-paper-muted">
            Business days, Monday to Friday, excluding US public holidays and any
            holiday period the supplier or carrier observes. Estimates are
            estimates: they are what the carrier has told us, not a date we can
            guarantee.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Who ships, and from where
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We are a dropshipping shop. Orders are fulfilled by our supplier, CJ
            Dropshipping, from its own warehouses — dispatch locations include
            [FILL: dispatch locations]. We do not inspect parcels before they go
            out, and we cannot add a note, gift-wrap an order, or repack it in
            our own materials.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">Split parcels.</strong> Items in
              one order can sit in different warehouses. They may ship on
              different days and arrive separately, each with its own tracking
              number. A parcel arriving without another item from the same order
              is usually not a missing item — check your other tracking numbers
              first.
            </li>
            <li>
              <strong className="font-semibold">Supplier packaging.</strong> Your
              parcel is packed in the supplier&rsquo;s materials, so it may not
              carry our name, may include the supplier&rsquo;s own paperwork or
              marketing insert, and may look like a marketplace parcel. This is
              normal.
            </li>
            <li>
              <strong className="font-semibold">One contract.</strong> Whatever
              the packaging says, your contract is with 3rd Eye Supply. Come to
              us with any problem and we will deal with the supplier on your
              behalf.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Tracking
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Tracking numbers are sent in the dispatch confirmation, one per
            parcel. Some economy lanes are only part-scanned: a number may show
            nothing for the first few days, then jump, and the last scan can be
            the final one you see before the parcel appears. Tracking that has
            gone quiet is not proof that a parcel is lost.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            If there has been no movement at all for [FILL: tracking stall
            window], write to [FILL: support email] with your order number and we
            will open a trace with the carrier and the supplier.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Import VAT, duty and customs
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Because goods are shipped from outside the European Union, most EU
            deliveries are imports. Import VAT, customs duty and any carrier
            handling fee are{" "}
            <strong className="font-semibold">
              the buyer&rsquo;s responsibility unless they are collected at
              checkout
            </strong>
            . Where we do collect them, they appear as a separate, itemised line
            before you pay. Where checkout does not collect them, they have not
            been paid, and the border will ask for them.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              The charge is normally raised by your national customs authority
              and collected by the delivering carrier — sometimes before
              delivery, sometimes on the doorstep, sometimes with a handling fee
              on top.
            </li>
            <li>
              The amount depends on your country&rsquo;s rules and the value of
              the parcel. We cannot calculate it in advance and we cannot pay it
              for you.
            </li>
            <li>
              We do not under-declare value, mark parcels as gifts, or describe
              goods as something they are not. Asking us to will get a polite no
              — it is a customs offence, and it exposes you as the importer of
              record.
            </li>
            <li>
              If you refuse a parcel to avoid import charges, the carrier returns
              or abandons it. We refund what comes back to us, less the outbound
              shipping and any return or disposal cost the carrier charges us.
            </li>
            <li>
              Customs can hold a parcel for inspection. That is outside our
              control and the carrier&rsquo;s, and it does not count against the
              delivery estimate.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Addresses, and parcels that come back
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Check the address at checkout — it is passed to the supplier exactly
            as you typed it, and it cannot always be changed after dispatch. If
            you spot a mistake, email [FILL: support email] immediately; we will
            try to intercept, but we cannot promise it.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            A parcel returned to the supplier as undeliverable or unclaimed is
            refunded once it arrives back, less the shipping that was actually
            spent. If you would rather have it sent again, we will quote the
            second shipping cost before doing anything.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Lost, damaged or held
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Tell us within [FILL: reporting window] of the expected delivery date,
            or of the delivery itself if it arrived damaged. Send your order
            number, a photograph of the parcel and its label, and a photograph of
            the damage. We will open a claim with the carrier and the supplier,
            and either replace the item or refund it — whichever you prefer —
            while the claim is running.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            What we cannot promise
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              A guaranteed delivery date, a timed delivery slot, or weekend and
              holiday delivery.
            </li>
            <li>
              That every item in an order travels together, or that all parcels
              are tracked end to end.
            </li>
            <li>
              That a carrier will not change its own route, fee or handling
              practice mid-journey.
            </li>
            <li>
              That peak seasons — late November through December, and any customs
              disruption — will run to the usual estimates.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Shipping costs and destinations
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Shipping is calculated at checkout from the destination, the weight
            and the number of parcels the supplier will use, and is shown before
            you pay — never added afterwards. We currently ship to the United
            States and the European Union; [FILL: excluded or restricted
            destinations]. If checkout will not accept your address, we cannot
            currently deliver there, and we would rather say so than take an order
            we cannot fulfil.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Questions
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Write to [FILL: support email] with your order number in the subject
            line. The Contact page explains what to include and when to expect a
            reply; Terms of Sale covers the contract itself; Returns &amp; Refunds
            covers sending something back.
          </p>
        </section>
      </div>
    </div>
  )
}
