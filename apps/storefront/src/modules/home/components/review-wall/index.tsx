/**
 * Review wall (issue #21) — ships as an honest frame.
 *
 * There is NO review data source in the stack yet: no review system,
 * no stored ratings, no order-linked testimonials. Per the redesign
 * rules, this section invents nothing — no quotes, no names, no
 * counts. When a real review source exists (post-purchase reviews),
 * render them in the specimen-card grid below and put the real count
 * in the heading. Agent Voice (issue #26) owns the final framing copy.
 */
const ReviewWall = () => {
  return (
    <section className="border-y border-paper-borderSoft bg-paper-surface paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-20">
        <div className="max-w-2xl">
          <h2 className="font-display text-4xl font-light tracking-tight text-paper-text">
            What people say after the box opens
          </h2>
          <p className="mt-4 font-humanist text-base leading-7 text-paper-muted">
            This is a young shop, and we are not going to fill this wall
            with borrowed praise or round numbers. Reviews from real
            orders will appear here as they come in — good ones and the
            other kind, in customers' own words.
          </p>
          <p className="mt-4 font-humanist text-sm leading-6 text-paper-muted">
            Ordered from us already? We read every email the shop gets —
            what you tell us shapes what we stock next.
          </p>
        </div>
      </div>
    </section>
  )
}

export default ReviewWall
