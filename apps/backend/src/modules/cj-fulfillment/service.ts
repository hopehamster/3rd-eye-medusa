/**
 * CJ dropship fulfillment provider.
 *
 * Registered in medusa-config.ts under the Fulfillment module's providers.
 * When an admin creates a fulfillment in Medusa, createFulfillment places
 * the order with the supplier automatically.
 *
 * Variant -> supplier mapping lives on variant metadata (`cj_vid`) and is
 * resolved via remote query at fulfillment time.
 *
 * Safety:
 * - dryRun (default true) logs the CJ payload instead of calling the API.
 *   Set CJ_DRY_RUN=false only after verifying a real order end-to-end.
 * - Items whose variant has no `cj_vid` are rejected loudly —
 *   never silently skipped.
 */
import {
  AbstractFulfillmentProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import type {
  CreateFulfillmentResult,
  CreateShippingOptionDTO,
  FulfillmentDTO,
  FulfillmentItemDTO,
  FulfillmentOption,
  FulfillmentOrderDTO,
  Logger,
} from "@medusajs/framework/types"
import { CJClient } from "./cj-client"
import type { CJModuleOptions, CJOrderPayload } from "./types"

type InjectedDependencies = {
  logger: Logger
  query: {
    graph: (q: {
      entity: string
      fields: string[]
      filters: Record<string, unknown>
    }) => Promise<{ data: Record<string, any>[] }>
  }
}

class CJFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "cj-fulfillment"

  protected logger_: Logger
  protected query_: InjectedDependencies["query"]
  protected options_: CJModuleOptions
  protected client_: CJClient
  protected dryRun_: boolean

  constructor(
    { logger, query }: InjectedDependencies,
    options: CJModuleOptions = {}
  ) {
    super()
    this.logger_ = logger
    this.query_ = query
    this.options_ = options
    this.dryRun_ = options.dryRun ?? process.env.CJ_DRY_RUN !== "false"
    this.client_ = new CJClient(options, logger)
  }

  /** Generic option names — the supplier name never reaches shoppers. */
  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      { id: "cj-standard", name: "Standard Shipping", is_return: false },
      { id: "cj-express", name: "Express Shipping", is_return: false },
    ]
  }

  async validateOption(data: Record<string, unknown>): Promise<boolean> {
    const id = (data as { id?: string }).id
    return id === "cj-standard" || id === "cj-express"
  }

  async validateFulfillmentData(
    optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!(await this.validateOption(optionData))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "CJ fulfillment: unknown shipping option"
      )
    }
    return { ...data, cj_option_id: (optionData as { id: string }).id }
  }

  /** Flat-rate options configured in admin; no live rating (never fabricate rates). */
  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    return false
  }

  /**
   * Resolve the supplier variant id for each fulfillment item.
   * Source of truth: variant metadata `cj_vid` (set by the catalog sync).
   * Path: fulfillment item -> order line item -> product variant -> metadata.
   */
  protected async resolveSupplierVids(
    lineItemIds: string[]
  ): Promise<Map<string, string>> {
    const { data: lineItems } = await this.query_.graph({
      entity: "order_line_item",
      fields: ["id", "variant_id"],
      filters: { id: lineItemIds },
    })
    const variantIds = [
      ...new Set(
        lineItems
          .map((li: { variant_id?: string }) => li.variant_id)
          .filter((id): id is string => typeof id === "string")
      ),
    ]
    const { data: variants } = await this.query_.graph({
      entity: "product_variant",
      fields: ["id", "metadata"],
      filters: { id: variantIds },
    })
    const vidByVariant = new Map<string, string>()
    for (const v of variants) {
      const vid = v.metadata?.cj_vid
      if (typeof vid === "string" && vid) {
        vidByVariant.set(v.id, vid)
      }
    }
    const lineItemToVid = new Map<string, string>()
    for (const li of lineItems as { id: string; variant_id?: string }[]) {
      const vid = li.variant_id ? vidByVariant.get(li.variant_id) : undefined
      if (vid) {
        lineItemToVid.set(li.id, vid)
      }
    }
    return lineItemToVid
  }

  async createFulfillment(
    data: Record<string, unknown>,
    items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    order: Partial<FulfillmentOrderDTO> | undefined,
    fulfillment: Partial<
      Omit<FulfillmentDTO, "provider_id" | "data" | "items">
    >,
    additionalData?: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    const emptyLabels: CreateFulfillmentResult["labels"] = []

    if (!order?.shipping_address) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "CJ fulfillment: order has no shipping address"
      )
    }

    const lineItemIds = items
      .map((i) => i.line_item_id)
      .filter((id): id is string => typeof id === "string")
    const vidMap = await this.resolveSupplierVids(lineItemIds)

    const lines = items.map((item) => {
      const vid = item.line_item_id
        ? vidMap.get(item.line_item_id)
        : undefined
      if (!vid) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `CJ fulfillment: line item ${item.line_item_id} has no cj_vid — ` +
            `tag its variant's metadata before fulfilling`
        )
      }
      return { vid, quantity: item.quantity ?? 1 }
    })

    const addr = order.shipping_address
    const payload: CJOrderPayload = {
      externalOrderNumber: `3ES-${order.display_id ?? order.id}`,
      customerName: `${addr.first_name ?? ""} ${addr.last_name ?? ""}`.trim(),
      emailAddress: order.email ?? undefined,
      shippingCountryCode: (addr.country_code ?? "").toUpperCase(),
      shippingProvince: addr.province ?? undefined,
      shippingCity: addr.city ?? undefined,
      shippingAddress: addr.address_1 ?? "",
      shippingAddress2: addr.address_2 ?? undefined,
      shippingZip: addr.postal_code ?? undefined,
      shippingPhone: addr.phone ?? undefined,
      products: lines,
      logisticName:
        data.cj_option_id === "cj-express"
          ? "CJPacket Express"
          : "CJPacket Ordinary",
      remark: "3rd Eye Supply",
    }

    if (this.dryRun_) {
      this.logger_.warn(
        `CJ fulfillment DRY RUN — order payload: ${JSON.stringify(payload)}`
      )
      return {
        data: { ...data, dry_run: true, cj_payload: payload },
        labels: emptyLabels,
      }
    }

    const result = await this.client_.createOrder(payload)
    this.logger_.info(
      `CJ fulfillment: created supplier order ${result.orderId} for Medusa order ${order.id}`
    )
    return {
      data: {
        ...data,
        cj_order_id: result.orderId,
        cj_order_number: result.orderNumber,
      },
      labels: emptyLabels,
    }
  }

  async cancelFulfillment(data: Record<string, unknown>): Promise<any> {
    // CJ has no reliable cancel endpoint for in-progress dropship orders.
    // Surface clearly so ops handles it in the CJ dashboard instead of
    // assuming a quiet success.
    const cjOrderId = data.cj_order_id
    this.logger_.warn(
      `CJ fulfillment: cancel requested for supplier order ${cjOrderId} — ` +
        `cancel manually in the CJ dashboard; Medusa cannot cancel it via API`
    )
    return {}
  }

  async getFulfillmentDocuments(
    data: Record<string, unknown>
  ): Promise<any> {
    const cjOrderId = data.cj_order_id
    if (typeof cjOrderId !== "string" || this.dryRun_) {
      return []
    }
    const detail = await this.client_.getOrderDetail(cjOrderId)
    if (!detail.trackingNumber) {
      return []
    }
    return [
      {
        tracking_number: detail.trackingNumber,
        tracking_url: `https://www.cjdropshipping.com/track/${detail.trackingNumber}`,
      },
    ]
  }
}

export default CJFulfillmentService
