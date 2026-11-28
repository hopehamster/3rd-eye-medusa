import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About & Our Promise | 3rd Eye Supply",
  description:
    "What 3rd Eye Supply sells and what we never claim — real stones, plain talk, treatments disclosed, and no healing, medical or outcome promises of any kind.",
}

export default async function AboutPage() {
  return (
    <div className="bg-paper-bg paper-grain text-paper-text">
      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <header className="mb-10 max-w-2xl">
          <h1 className="font-display text-4xl small:text-5xl font-light tracking-tight text-paper-text mb-4">
            About &amp; Our Promise
          </h1>
          <p className="font-display text-2xl font-light tracking-tight text-paper-text leading-snug">
            Real stones. Plain talk. Nothing promised but the stone itself.
          </p>
          <p className="mt-6 font-humanist text-paper-muted leading-7">
            That sentence is the whole business model. This page says what it
            means in practice — what we sell, how it reaches you, and the
            claims we will never make to sell it.
          </p>
        </header>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            What we sell
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Natural stones and goods made from them — crystals, carvings,
            jewellery, incense and ritual objects — chosen for the material
            itself and for how a piece looks and feels in the hand. When a
            listing names a stone, that is the stone we are selling you:
            quartz, amethyst, agate, obsidian, moonstone and the rest, as
            described on the page.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            Stone is a natural material, so no two pieces are identical.
            Colour, veining, pattern, size and weight vary from piece to
            piece and from the photographs. That variation is not a defect —
            it is how you can tell the material grew in the ground instead of
            a mould. A piece that is genuinely not what its listing described
            is a different matter, and we will put it right.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            What we never claim
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We sell objects, not outcomes. Nothing in this shop is promised
            to heal, treat, protect, attract, calm, energise or change
            anything in your body, your health, your luck or your life.
          </p>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>
              <strong className="font-semibold">No medical claims.</strong>{" "}
              No stone here diagnoses, treats, cures or prevents anything.
              If you have a health concern, see a doctor.
            </li>
            <li>
              <strong className="font-semibold">No effect claims.</strong>{" "}
              We do not say a stone will bring wealth, love, sleep, focus,
              protection or any other result. If a listing mentions what a
              stone is traditionally associated with, that is the tradition
              talking — folklore and cultural practice, written down because
              people find it interesting — not a promise from us.
            </li>
            <li>
              <strong className="font-semibold">No dressed-up sourcing.</strong>{" "}
              We will never tell you a stone was handmade in a local workshop
              or shipped from down the road. It was not. Our supplier ships
              your order directly to you, and the Shipping page says so in
              full.
            </li>
          </ul>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            People buy these pieces for their own reasons — beauty, ritual,
            collecting, a gift, a stone they simply like the look of. All of
            those are good reasons. None of them needs a promise attached.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            Treatments, disclosed
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            Some stones in the wider trade are dyed, heated, coated,
            irradiated or stabilised to change or protect their colour. That
            is common, it is not automatically a problem — and it should
            never be a surprise. Where our supplier tells us a piece has
            been treated, the listing says so. Where the supplier does not
            say, we do not guess in either direction: the listing will not
            call a stone untreated unless we have been told it is.
          </p>
          <p className="mt-4 font-humanist text-[15px] leading-7 text-paper-text">
            We do not assay stones in a lab. What we can do — and do — is
            hold our listings to what the supplier states, and refund you
            without argument when a piece arrives plainly different from its
            description.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            How it reaches you
          </h2>
          <p className="font-humanist text-[15px] leading-7 text-paper-text">
            We are a small shop in Las Vegas, Nevada, and we are a
            dropshipping shop: orders are packed and sent by our supplier,
            CJ Dropshipping, from its own warehouses straight to your door.
            That is how the prices stay where they are, and why delivery is
            measured in days rather than hours. Whatever the packaging says,
            your contract is with 3rd Eye Supply — come to us with any
            problem and we deal with the supplier on your behalf.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-light tracking-tight text-paper-text mt-12 mb-4">
            The short version
          </h2>
          <ul className="mt-5 list-disc pl-5 space-y-2 font-humanist text-[15px] leading-7 text-paper-text marker:text-paper-border">
            <li>The stone is real, and it is the stone the listing names.</li>
            <li>It will look like the photograph&rsquo;s close relative, not its twin.</li>
            <li>Treatments are disclosed where we know them.</li>
            <li>It comes from our supplier&rsquo;s warehouse, and we say so.</li>
            <li>It promises nothing but itself.</li>
          </ul>
          <p className="mt-5 font-humanist text-[15px] leading-7 text-paper-text">
            Questions: write to support@3rdeyesupply.com. Shipping &amp;
            Delivery and Returns &amp; Refunds cover the parcels; Terms of
            Sale covers the contract; the FAQ covers the quick answers.
          </p>
        </section>
      </div>
    </div>
  )
}
