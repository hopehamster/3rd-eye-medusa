import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * GET /admin/cj-review/products
 * Lists draft CJ products with cost, price, margin, and image status.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const productModule = req.scope.resolve(Modules.PRODUCT)

    const [products] = await productModule.listAndCountProducts(
      { status: "draft" },
      {
        relations: ["variants", "variants.prices", "images"],
        take: 100,
        order: { created_at: "DESC" },
      }
    )

    // Filter to CJ products (have cj_pid in metadata)
    const cjProducts = products.filter((p: any) => p.metadata?.cj_pid)

    const result = cjProducts.map((p: any) => {
      const cjCost = parseFloat(p.metadata?.cj_cost) || 0
      const cjPid = p.metadata?.cj_pid || ""
      const source = p.metadata?.source || "unknown"

      // Get retail price from first variant (in cents, convert to dollars)
      let retailPrice = 0
      if (p.variants?.length > 0) {
        const variant = p.variants[0]
        if (variant.prices?.length > 0) {
          retailPrice = variant.prices[0].amount / 100
        }
      }

      const marginPct =
        retailPrice > 0 && cjCost > 0
          ? Math.round(((retailPrice - cjCost) / retailPrice) * 100)
          : 0

      const hasImages = (p.images?.length || 0) > 0 || !!p.thumbnail
      const imageCount = p.images?.length || 0

      return {
        id: p.id,
        title: p.title,
        thumbnail: p.thumbnail || (p.images?.[0]?.url || null),
        cj_pid: cjPid,
        cj_cost: cjCost,
        retail_price: retailPrice,
        margin_pct: marginPct,
        has_images: hasImages,
        image_count: imageCount,
        source,
        created_at: p.created_at,
      }
    })

    res.json({ products: result, count: result.length })
  } catch (e) {
    const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
    logger.error("[cj-review] list failed: " + (e as Error).message)
    res.status(500).json({ error: "Could not load CJ draft products." })
  }
}
