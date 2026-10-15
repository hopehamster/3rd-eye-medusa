import { Metadata } from "next"
import ProductPageClient from "./ProductPageClient"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  // Use handle for title (SEO-friendly without server-side fetch)
  const title = params.handle
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  return {
    title: `${title} | 3rd Eye Supply`,
    description: `${title} - 3rd Eye Supply`,
  }
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  return <ProductPageClient countryCode={params.countryCode} handle={params.handle} />
}
