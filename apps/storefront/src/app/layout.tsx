import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import FilmGrain from "@modules/common/components/film-grain"
import PostHogProvider from "@modules/analytics/components/posthog-provider"
import "styles/globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["300", "400", "500", "600"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "3rd Eye Supply — Crystals, Ritual Objects & Spiritual Goods",
    template: "%s | 3rd Eye Supply",
  },
  description:
    "3rd Eye Supply is a curated source for crystals, ritual objects, and spiritual goods — chosen for intention and beauty, shipped directly to you.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="dark"
      className={`dark ${fraunces.variable} ${inter.variable}`}
    >
      <body className="bg-cosmos-bg text-cosmos-text antialiased">
        <PostHogProvider>
          <FilmGrain />
          <main className="relative">{props.children}</main>
        </PostHogProvider>
      </body>
    </html>
  )
}
