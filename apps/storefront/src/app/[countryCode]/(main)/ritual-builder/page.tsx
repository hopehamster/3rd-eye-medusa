import { Metadata } from "next"
import RitualBuilder from "@modules/ritual/components/ritual-builder"

export const metadata: Metadata = {
  title: "Ritual Builder | 3rd Eye Supply",
  description:
    "Build a custom ritual kit: choose your intention, pick aligned pieces, and receive a step-by-step ritual written for you.",
}

export default async function RitualBuilderPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-widest text-violet-400 mb-2">
          3rd Eye Supply
        </p>
        <h1 className="text-3xl font-semibold mb-3">Ritual Builder</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Choose an intention, gather the pieces that align with it, and
          receive a ritual written around exactly what you hold.
        </p>
      </div>
      <RitualBuilder countryCode={countryCode} />
    </div>
  )
}
