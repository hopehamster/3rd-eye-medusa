/**
 * CJ product discovery workflow.
 *
 * Runs on a schedule (see src/jobs/cj-product-discovery.ts). Searches the
 * CJ catalog for metaphysical products matching the niche, filters for
 * US-warehouse stock and margin viability, and imports winners as DRAFT
 * products — never published. A human reviews every draft in admin before
 * it can go live. The review gate is deliberate: this brand is curated.
 *
 * Flow per candidate:
 *   CJ search -> dedupe + filters -> draft product -> AI content draft
 *   -> intents tagged -> waits in admin for human approval
 *
 * Env:
 *   CJ_API_KEY, CJ_EMAIL        - CJ credentials (shared with fulfillment)
 *   CJ_DISCOVERY_KEYWORDS       - comma-separated search terms
 *   CJ_DISCOVERY_MAX_PRICE      - max CJ sell price in USD (default 25)
 *   CJ_DISCOVERY_MIN_LISTED     - min times listed = social proof (default 50)
 *   CJ_DISCOVERY_LIMIT          - max imports per run (default 5)
 *   CJ_DISCOVERY_DRY_RUN        - "true" to log without creating (default false)
 */
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type {
  IProductModuleService,
  Logger,
} from "@medusajs/framework/types"
import { CJClient } from "../modules/cj-fulfillment/cj-client"
import { AI_CONTENT_MODULE } from "../modules/ai-content"
import type { CJProductSummary } from "../modules/cj-fulfillment/types"

const DEFAULT_KEYWORDS = [
  "amethyst crystal",
  "crystal bracelet",
  "orgonite pyramid",
  "tarot cards",
  "sage bundle",
  "singing bowl",
  "evil eye bracelet",
  "chakra stones",
  "moonstone pendant",
  "rose quartz",
  "crystal tree",
  "pendulum",
]

interface Candidate extends CJProductSummary {
  keyword: string
}

interface DiscoveryConfig {
  keywords: string[]
  maxPrice: number
  minListed: number
  limit: number
  dryRun: boolean
}

function readConfig(): DiscoveryConfig {
  return {
    keywords: (process.env.CJ_DISCOVERY_KEYWORDS ?? "")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)
      .concat(DEFAULT_KEYWORDS)
      .filter((k, i, arr) => arr.indexOf(k) === i),
    maxPrice: Number(process.env.CJ_DISCOVERY_MAX_PRICE ?? 25),
    minListed: Number(process.env.CJ_DISCOVERY_MIN_LISTED ?? 50),
    limit: Number(process.env.CJ_DISCOVERY_LIMIT ?? 5),
    dryRun: process.env.CJ_DISCOVERY_DRY_RUN === "true",
  }
}

const discover = createStep(
  "discover",
  async (_, { container }) => {
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const config = readConfig()
    const client = new CJClient(
      {
        apiKey: process.env.CJ_API_KEY,
        email: process.env.CJ_EMAIL,
      },
      logger
    )

    const candidates: Candidate[] = []
    for (const keyword of config.keywords) {
      try {
        const results = await client.searchProducts({
          keyWord: keyword,
          size: 10,
          countryCode: "US",
          endSellPrice: String(config.maxPrice),
          orderBy: 1,
          sort: "desc",
        })
        for (const r of results) {
          candidates.push({ ...r, keyword })
        }
        logger.info(
          `CJ discovery: "${keyword}" returned ${results.length} results`
        )
      } catch (e) {
        logger.warn(
          `CJ discovery: search failed for "${keyword}": ${(e as Error).message}`
        )
      }
    }
    return new StepResponse({ candidates, config })
  }
)

const filter = createStep(
  "filter",
  async (
    {
      candidates,
      config,
    }: { candidates: Candidate[]; config: DiscoveryConfig },
    { container }
  ) => {
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const productModule =
      container.resolve<IProductModuleService>(Modules.PRODUCT)

    // Products already imported (by CJ product id in variant metadata)
    const [existingVariants] =
      await productModule.listAndCountProductVariants(
        {},
        { select: ["id", "metadata"] }
      )
    const importedPids = new Set(
      existingVariants
        .map((v) => (v.metadata as Record<string, unknown> | null)?.cj_pid)
        .filter((p): p is string => typeof p === "string")
    )

    const seen = new Set<string>()
    const filtered: Candidate[] = []
    for (const c of candidates) {
      if (!c.id || seen.has(c.id)) continue
      seen.add(c.id)
      if (importedPids.has(c.id)) continue
      const price = Number(c.sellPrice ?? 0)
      if (!price || price > config.maxPrice) continue
      if ((c.listedNum ?? 0) < config.minListed) continue
      filtered.push(c)
      if (filtered.length >= config.limit * 3) break
    }

    // Verify US-warehouse stock for finalists (extra API calls — keep tight)
    const client = new CJClient(
      { apiKey: process.env.CJ_API_KEY, email: process.env.CJ_EMAIL },
      logger
    )
    const stocked: Candidate[] = []
    for (const c of filtered.slice(0, config.limit * 2)) {
      try {
        const inv = await client.getInventory(c.id)
        const usStock = inv
          .filter((i) => i.countryCode === "US")
          .reduce((sum, i) => sum + (i.totalInventoryNum ?? 0), 0)
        if (usStock > 0) {
          stocked.push(c)
        }
      } catch {
        // Inventory check failed — skip rather than import blind
      }
      if (stocked.length >= config.limit) break
    }

    logger.info(
      `CJ discovery: ${candidates.length} raw -> ${filtered.length} filtered -> ${stocked.length} stocked`
    )
    return new StepResponse({ finalists: stocked, config })
  }
)

const importDrafts = createStep(
  "import-drafts",
  async (
    {
      finalists,
      config,
    }: { finalists: Candidate[]; config: DiscoveryConfig },
    { container }
  ) => {
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const productModule =
      container.resolve<IProductModuleService>(Modules.PRODUCT)
    const aiContent = container.resolve(AI_CONTENT_MODULE) as {
      generateProductContent: (input: {
        rawTitle: string
        rawDescription?: string
      }) => Promise<{
        title: string
        description: string
        intents: string[]
        meta_title?: string
        meta_description?: string
        care?: string
      }>
    }

    const imported: string[] = []
    for (const c of finalists) {
      const title = c.nameEn?.trim() || `CJ product ${c.id}`
      if (config.dryRun) {
        logger.info(`CJ discovery DRY RUN — would import: ${title} (${c.id})`)
        imported.push(c.id)
        continue
      }
      try {
        const [product] = await productModule.createProducts([
          {
            title,
            status: "draft",
            images: c.bigImage ? [{ url: c.bigImage }] : [],
            options: [{ title: "Style", values: ["Default"] }],
            variants: [
              {
                title: "Default",
                options: { Style: "Default" },
                metadata: { cj_pid: c.id, source: "cj-discovery" },
              },
            ],
            metadata: {
              cj_pid: c.id,
              cj_keyword: c.keyword,
              source: "cj-discovery",
              discovered_at: new Date().toISOString(),
            },
          },
        ])

        // Prices live in the pricing module (Medusa v2): each variant gets
        // an auto-created price set — add our retail price to it.
        try {
          const pricing = container.resolve(Modules.PRICING) as {
            addPrices: (data: {
              priceSetId: string
              prices: { amount: number; currency_code: string }[]
            }) => Promise<unknown>
          }
          const [variant] = await productModule.listProductVariants(
            { product_id: product.id },
            { relations: ["price_set"] }
          )
          const priceSetId = (variant as { price_set?: { id?: string } })
            ?.price_set?.id
          if (priceSetId) {
            await pricing.addPrices({
              priceSetId,
              prices: [
                {
                  amount: Math.round(Number(c.sellPrice ?? 0) * 250),
                  currency_code: "usd",
                },
              ],
            })
          } else {
            logger.warn(
              `CJ discovery: no price set found for variant of ${c.id} — price not set`
            )
          }
        } catch (priceErr) {
          logger.warn(
            `CJ discovery: price creation failed for ${c.id}: ${(priceErr as Error).message}`
          )
        }

        // AI content draft — applied to the draft product, still needs
        // human review before publishing (the review gate).
        try {
          const draft = await aiContent.generateProductContent({
            rawTitle: title,
          })
          await productModule.updateProducts(product.id, {
            title: draft.title || undefined,
            description: draft.description || undefined,
            metadata: {
              intents: draft.intents,
              meta_title: draft.meta_title,
              meta_description: draft.meta_description,
              care: draft.care,
              ai_content_applied: new Date().toISOString(),
            },
          })
        } catch (e) {
          logger.warn(
            `CJ discovery: AI content failed for ${c.id}: ${(e as Error).message} — product kept as draft with raw title`
          )
        }

        logger.info(`CJ discovery: imported draft ${product.id} (${title})`)
        imported.push(product.id)
      } catch (e) {
        logger.warn(
          `CJ discovery: import failed for ${c.id}: ${(e as Error).message}`
        )
      }
    }
    return new StepResponse({ imported })
  }
)

export const cjProductDiscoveryWorkflow = createWorkflow(
  "cj-product-discovery",
  () => {
    const { candidates, config } = discover()
    const { finalists, config: filterConfig } = filter({
      candidates,
      config,
    })
    const { imported } = importDrafts({ finalists, config: filterConfig })
    return new WorkflowResponse({ imported })
  }
)
