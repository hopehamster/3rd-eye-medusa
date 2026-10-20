import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Host voice (issue #21) — a named human runs this store.
 * Copy: Agent Voice (issue #26) approved set, Michael named as host.
 */
const HostVoice = () => {
  return (
    <section className="bg-paper-bg paper-grain text-paper-text">
      <div className="content-container relative z-[2] py-16 small:py-24">
        <div className="grid grid-cols-1 gap-10 small:grid-cols-[1.3fr_1fr] small:gap-16">
          <div>
            <h2 className="font-display text-4xl font-light tracking-tight text-paper-text">
              A person picks every stone in this shop.
            </h2>
            <div className="mt-5 max-w-xl space-y-4 font-humanist text-base leading-7 text-paper-muted">
              <p>
                I am Michael. I run 3rd Eye Supply out of Las Vegas.
              </p>
              <p>
                I started this shop because I got tired of two kinds of
                crystal stores: the ones that promise a bracelet will fix
                your life, and the ones so polished you cannot tell
                whether the stones are real. This one is neither. Every
                stone here is natural, every description says what the
                piece actually is, and what people have traditionally used
                it for is labeled as tradition — not as a promise.
              </p>
              <p>
                Pick the stone you keep coming back to. That is usually
                the right one.
              </p>
            </div>
            <p className="mt-6 font-display text-lg text-paper-text">
              — Michael, 3rd Eye Supply, Las Vegas
            </p>
          </div>

          <div className="specimen-card h-fit p-6">
            <p className="specimen-label">How the counter works</p>
            <ul className="mt-4 space-y-3">
              <li className="specimen-meta">
                Every listing names the stone and its material. No mystery
                stock.
              </li>
              <li className="specimen-meta">
                Shelves are organized by what you are dealing with, not by
                what the supplier called it.
              </li>
              <li className="specimen-meta">
                Broken or wrong on arrival means a replacement or a
                refund. That is the whole policy.
              </li>
            </ul>
            <LocalizedClientLink
              href="/guides"
              className="mt-5 inline-block font-humanist text-sm font-semibold text-paper-accent hover:text-paper-accentBright"
            >
              Read the guides the counter wrote
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HostVoice
