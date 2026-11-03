import { Metadata } from "next"
import OracleExperience from "@modules/oracle/components/oracle-experience"
import OracleMemory from "@modules/oracle/components/oracle-memory"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "The Oracle | 3rd Eye Supply",
  description:
    "Ask the Oracle for metaphysical guidance — or take the guided quiz. Products, rituals, and knowledge, tailored to what you need.",
}

export default async function OraclePage({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ about?: string }>
}) {
  const { countryCode } = await params
  const { about } = await searchParams
  const customer = await retrieveCustomer()
  const initialQuestion = about
    ? `I'm looking at "${about.replace(/-/g, " ")}" in your shop. Tell me about it — is it right for me?`
    : undefined
  return (
    <>
      <OracleExperience
        countryCode={countryCode}
        initialAbout={initialQuestion}
        isSignedIn={Boolean(customer)}
      />
      {/* Renders nothing for guests; the control is for members with memory. */}
      <OracleMemory />
    </>
  )
}
