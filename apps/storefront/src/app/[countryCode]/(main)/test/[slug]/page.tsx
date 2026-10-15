export const dynamic = "force-dynamic"

export default async function TestPage({
  params,
}: {
  params: Promise<{ countryCode: string; slug: string }>
}) {
  const { countryCode, slug } = await params
  return (
    <div>
      <h1>Test Page Works</h1>
      <p>Country: {countryCode}</p>
      <p>Slug: {slug}</p>
    </div>
  )
}
