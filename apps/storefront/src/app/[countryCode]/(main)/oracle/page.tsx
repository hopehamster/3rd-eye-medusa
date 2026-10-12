import { Metadata } from "next"
import OracleChat from "@modules/oracle/components/oracle-chat"

export const metadata: Metadata = {
  title: "The Oracle | 3rd Eye Supply",
  description:
    "Ask the Oracle for metaphysical guidance — or simply to learn. Products, rituals, and knowledge, tailored to what you need.",
}

export default async function OraclePage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  return <OracleChat countryCode={countryCode} />
}
