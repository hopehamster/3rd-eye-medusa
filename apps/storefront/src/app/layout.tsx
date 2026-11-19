import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import FilmGrain from "@modules/common/components/film-grain"
import ScrollProgress from "@modules/common/components/scroll-progress"
import ScrollReset from "@modules/common/components/scroll-reset"
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
    default: "Crystals, Ritual Objects & Spiritual Goods",
    template: "%s | 3rd Eye Supply",
  },
  description:
    "Curated crystals, ritual objects, and spiritual goods. Chosen for intention and beauty, shipped directly to you.",
  openGraph: {
    title: "3rd Eye Supply — Crystals, Ritual Objects & Spiritual Goods",
    description:
      "Curated crystals, ritual objects, and spiritual goods. Chosen for intention and beauty, shipped directly to you.",
    siteName: "3rd Eye Supply",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "3rd Eye Supply — Crystals, Ritual Objects & Spiritual Goods",
    description:
      "Curated crystals, ritual objects, and spiritual goods. Chosen for intention and beauty, shipped directly to you.",
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-mode="dark"
      className={`dark ${fraunces.variable} ${inter.variable}`}
    >
      <body className="bg-cosmos-bg text-cosmos-text antialiased flex h-[100dvh] flex-col overflow-hidden">
        <PostHogProvider>
          <ScrollReset />
          <FilmGrain />
          <ScrollProgress />
          {/*
            Issue #149: the app shell is a height-locked flex column. <main> is
            the only scroll area and takes whatever height the consent band
            (rendered by PostHogProvider after it) leaves. The band therefore
            reserves its own space at the bottom of the viewport instead of
            overlaying content, so no primary action can sit underneath it.
          */}
          <main
            data-scroll-root
            className="relative flex-1 min-h-0 overflow-y-auto"
          >
            {props.children}
          </main>
        </PostHogProvider>
      </body>
    </html>
  )
}
