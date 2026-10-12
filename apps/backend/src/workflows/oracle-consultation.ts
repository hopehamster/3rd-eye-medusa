/**
 * oracle-consultation workflow.
 * classify -> retrieve (canon + in-stock products) -> compose -> log
 */
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ORACLE_MODULE } from "../modules/oracle"
import type OracleModuleService from "../modules/oracle/service"
import {
  classifyQuestion,
  composeGuidance,
  composeKnowledge,
  type OracleProduct,
} from "../modules/oracle/deepseek"
import { retrieveCanon } from "../modules/oracle/canon"
import { intentTag } from "../modules/oracle/taxonomy"

interface Classified {
  intents: string[]
  mode: "guidance" | "knowledge"
}

const classifyStep = createStep(
  "classify",
  async (
    { question }: { question: string },
    { container }
  ): Promise<StepResponse<Classified>> => {
    const oracle = container.resolve(ORACLE_MODULE) as OracleModuleService
    const { intents, mode } = await classifyQuestion(question)
    return new StepResponse({
      intents: await oracle.sanitizeIntents(intents),
      mode,
    })
  }
)

interface ProductHit extends OracleProduct {
  thumbnail: string | null
  handle: string
}

const retrieveProductsStep = createStep(
  "retrieve-products",
  async (
    {
      intents,
      mode,
      question,
    }: Classified & { question: string },
    { container }
  ): Promise<StepResponse<{ products: ProductHit[] }>> => {
    if (mode === "knowledge" || intents.length === 0) {
      return new StepResponse({ products: [] })
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const tags = intents.map(intentTag)

    const { data: products } = (await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "thumbnail",
        "variants.id",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "variants.inventory_items.inventory_item_id",
      ],
      filters: { tags: { value: tags }, status: "published" },
    })) as { data: any[] }

    // Stock gate: exclude products whose inventory levels are all depleted.
    // Products with no levels at all are treated as available (new/untracked).
    let availableIds: Set<string> | null = null
    try {
      const itemIds = [
        ...new Set(
          products.flatMap((p) =>
            (p.variants ?? []).flatMap((v: any) =>
              (v.inventory_items ?? []).map((i: any) => i.inventory_item_id)
            )
          )
        ),
      ] as string[]

      if (itemIds.length > 0) {
        const inventory = container.resolve(Modules.INVENTORY)
        const levels = await inventory.listInventoryLevels({
          inventory_item_id: itemIds,
        })
        const byItem = new Map<string, number>()
        for (const lvl of levels) {
          const avail =
            (lvl.stocked_quantity ?? 0) - (lvl.reserved_quantity ?? 0)
          byItem.set(
            lvl.inventory_item_id,
            (byItem.get(lvl.inventory_item_id) ?? 0) + avail
          )
        }
        availableIds = new Set(
          products
            .filter((p) => {
              const ids = (p.variants ?? []).flatMap((v: any) =>
                (v.inventory_items ?? []).map((i: any) => i.inventory_item_id)
              ) as string[]
              if (ids.length === 0) {
                return true
              }
              return ids.some((id) => (byItem.get(id) ?? 0) > 0)
            })
            .map((p) => p.id)
        )
      }
    } catch {
      // Inventory unavailable — degrade to published+tagged (logged by caller)
      availableIds = null
    }

    const hits: ProductHit[] = products
      .filter((p) => !availableIds || availableIds.has(p.id))
      .slice(0, 6)
      .map((p) => {
        const variant = (p.variants ?? [])[0] ?? {}
        const price = (variant.prices ?? [])[0] ?? {}
        const amount =
          typeof price.amount === "number"
            ? `$${(price.amount / 100).toFixed(2)}`
            : ""
        return {
          id: p.id,
          title: p.title,
          handle: p.handle,
          thumbnail: p.thumbnail ?? null,
          price: amount,
          variantId: variant.id ?? null,
        }
      })

    // Semantic fallback: if tag matching found nothing, ask Voyage for
    // products whose meaning matches the question.
    if (hits.length === 0 && question.trim()) {
      try {
        const search = await query.search({
          entity: "product",
          fields: ["id", "title", "handle", "thumbnail"],
          filters: {},
          search_options: {
            vector: {
              query: question.trim().slice(0, 2000),
              field: "semantic",
            },
          },
          pagination: { take: 6 },
        })
        const docs = (search as { data?: any[] }).data ?? []
        for (const d of docs.slice(0, 6)) {
          if (d?.id && !hits.some((h) => h.id === d.id)) {
            hits.push({
              id: d.id,
              title: d.title,
              handle: d.handle,
              thumbnail: d.thumbnail ?? null,
              price: "",
              variantId: null,
            })
          }
        }
      } catch {
        // Semantic search unavailable — return tag results (empty)
      }
    }

    return new StepResponse({ products: hits })
  }
)

interface Composed {
  answer: string
  picks: { product_id: string; why_it_fits: string }[]
  canonTitles: string[]
  needsCanon: boolean
}

const composeStep = createStep(
  "compose",
  async (
    {
      question,
      intents,
      mode,
      products,
    }: { question: string } & Classified & { products: ProductHit[] }
  ): Promise<StepResponse<Composed>> => {
    const canonDocs = await retrieveCanon(intents)
    const excerpts = canonDocs.map((d) => `### ${d.title}\n${d.excerpt}`)

    if (mode === "knowledge") {
      const answer = await composeKnowledge({
        question,
        intents,
        canonExcerpts: excerpts,
      })
      return new StepResponse({
        answer,
        picks: [],
        canonTitles: canonDocs.map((d) => d.title),
        needsCanon: canonDocs.length === 0,
      })
    }

    const { answer, picks } = await composeGuidance({
      question,
      intents,
      canonExcerpts: excerpts,
      products,
    })
    return new StepResponse({
      answer,
      picks,
      canonTitles: canonDocs.map((d) => d.title),
      needsCanon: false,
    })
  }
)

const logStep = createStep(
  "log",
  async (
    {
      question,
      intents,
      mode,
      picks,
      needsCanon,
      sessionId,
    }: {
      question: string
      sessionId?: string
    } & Classified &
      Pick<Composed, "picks" | "needsCanon">,
    { container }
  ): Promise<StepResponse<{ logId: string | null }>> => {
    try {
      const oracle = container.resolve(ORACLE_MODULE) as OracleModuleService
      const created = await oracle.createOracleLogs({
        question,
        intents,
        mode,
        productIds: picks.map((p) => p.product_id),
        needsCanon,
        sessionId: sessionId ?? null,
      })
      return new StepResponse({ logId: created?.id ?? null })
    } catch {
      // Logging must never break the consultation
      return new StepResponse({ logId: null })
    }
  }
)

export interface OracleConsultationInput {
  question: string
  sessionId?: string
}

export const oracleConsultationWorkflow = createWorkflow(
  "oracle-consultation",
  (input: OracleConsultationInput) => {
    const classified = classifyStep({ question: input.question })
    const retrieved = retrieveProductsStep({
      intents: classified.intents,
      mode: classified.mode,
      question: input.question,
    })
    const composed = composeStep({
      question: input.question,
      intents: classified.intents,
      mode: classified.mode,
      products: retrieved.products,
    })
    const logged = logStep({
      question: input.question,
      sessionId: input.sessionId,
      intents: classified.intents,
      mode: classified.mode,
      picks: composed.picks,
      needsCanon: composed.needsCanon,
    })

    return new WorkflowResponse({
      answer: composed.answer,
      picks: composed.picks,
      products: retrieved.products,
      intents: classified.intents,
      mode: classified.mode,
      logId: logged.logId,
    })
  }
)
