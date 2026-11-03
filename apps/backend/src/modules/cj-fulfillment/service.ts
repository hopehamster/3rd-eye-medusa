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
import type { CJModuleOptions, CJOrderPayload, CJOrderLine } from "./types"

type QueryLike = {
  graph: (q: {
    entity: string
    fields: string[]
    filters: Record<string, unknown>
  }) => Promise<{ data: Record<string, any>[] }>
}

/**
 * Providers are instantiated in the fulfillment module's own scope, where the
 * core `query` service is NOT eagerly injectable. Destructuring `query` in the
 * constructor threw AwilixResolutionError ("Could not resolve 'query'"), which
 * made the whole provider unavailable and returned 500 whenever a cart tried to
 * use a CJ shipping option.
 *
 * So the cradle is kept and `query` is resolved lazily, only when a method that
 * actually needs it runs.
 */
type InjectedDependencies = {
  logger: Logger
  query?: QueryLike
}


/**
 * The CJ order payload, built in one place so the contract probe can exercise
 * the real shape instead of a copy of it.
 *
 * Exported for scripts/cj-contract-probe.ts: CJ has no sandbox, so the only way
 * to check this payload without buying anything is to send it with a product id
 * CJ cannot resolve and read the validation error.
 */
export function buildCJOrderPayload(
  order: {
    id?: string
    display_id?: number | string | null
    email?: string | null
    shipping_address?: {
      first_name?: string | null
      last_name?: string | null
      country_code?: string | null
      province?: string | null
      city?: string | null
      address_1?: string | null
      address_2?: string | null
      postal_code?: string | null
      phone?: string | null
    } | null
  },
  data: { cj_option_id?: string | null },
  lines: CJOrderLine[]
): CJOrderPayload {
  const addr = order.shipping_address ?? {}
  const name = `${addr.first_name ?? ""} ${addr.last_name ?? ""}`.trim()
  const country = (addr.country_code ?? "").toUpperCase()
  return {
    externalOrderNumber: `3ES-${order.display_id ?? order.id ?? "unknown"}`,
    // CJ rejected `customerName` with "1600300 shippingCustomerName must be not
    // empty" — the key has to be shippingCustomerName.
    // CJ wants both spellings: dropping either yields "1600300 <name> must be
    // not empty" for the one you dropped.
    shippingCustomerName: name,
    customerName: name,
    emailAddress: order.email ?? undefined,
    // CJ rejects the order without this ("1600300 fromCountryCode must not be
    // empty"). The catalogue is CJ China stock; override with CJ_FROM_COUNTRY.
    fromCountryCode: (process.env.CJ_FROM_COUNTRY ?? "CN").toUpperCase(),
    shippingCountry: country,
    shippingCountryCode: country,
    shippingProvince: addr.province ?? undefined,
    shippingCity: addr.city ?? undefined,
    shippingAddress: addr.address_1 ?? "",
    shippingAddress2: addr.address_2 ?? undefined,
    shippingZip: addr.postal_code ?? undefined,
    shippingPhone: addr.phone ?? undefined,
    products: lines,
    logisticName:
      data.cj_option_id === "cj-express" ? "CJPacket Express" : "CJPacket Ordinary",
    remark: "3rd Eye Supply",
  }
}

class CJFulfillmentService extends AbstractFulfillmentProviderService {
  static identifier = "cj-fulfillment"

  protected logger_: Logger
  protected container_: InjectedDependencies
  protected query_: QueryLike | null = null
  protected options_: CJModuleOptions
  protected client_: CJClient
  protected dryRun_: boolean

  constructor(container: InjectedDependencies, options: CJModuleOptions = {}) {
    super()
    this.logger_ = container.logger
    this.container_ = container
    this.options_ = options
    this.dryRun_ = options.dryRun ?? process.env.CJ_DRY_RUN !== "false"
    this.client_ = new CJClient(options, container.logger)
  }

  /** Resolve the core query service on demand, not in the constructor. */
  private resolveQuery(): QueryLike {
    if (this.query_) {
      return this.query_
    }
    const lazily = (this.container_ as unknown as { query?: QueryLike }).query
    if (!lazily) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "CJ fulfillment: the query service is unavailable in this scope."
      )
    }
    this.query_ = lazily
    return lazily
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
   * Refuse to place a second supplier order for the same Medusa order.
   *
   * Nothing in the provider prevented this before: every call reached
   * /shopping/order/createOrder, so a retry, a double-click or a replayed
   * workflow would buy the goods twice and ship two parcels. The CJ order id is
   * written back onto the order's metadata when a real order is placed, so that
   * is the record we check.
   *
   * Cancelled orders are refused too — placing a supplier order for an order the
   * shop has already cancelled is money spent on nothing.
   */
  protected async assertNotAlreadyPlaced(
    order: Partial<FulfillmentOrderDTO>
  ): Promise<void> {
    const orderId = order.id
    if (!orderId) {
      return
    }

    let row: { metadata?: Record<string, unknown> | null; status?: string | null } | undefined
    try {
      const { data } = await this.resolveQuery().graph({
        entity: "order",
        fields: ["id", "status", "metadata"],
        filters: { id: orderId },
      })
      row = (data as typeof row[])?.[0]
    } catch {
      // If the order cannot be read, fall through: refusing to fulfil because a
      // lookup failed would be worse than the duplicate the guard prevents.
      return
    }
    if (!row) {
      return
    }

    const placed = row.metadata?.cj_order_id
    if (typeof placed === "string" && placed.length > 0) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        `CJ fulfillment: order ${orderId} was already placed with CJ as ` +
          `${placed}. Refusing to create a second supplier order.`
      )
    }

    if (row.status === "canceled") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `CJ fulfillment: order ${orderId} is cancelled. Refusing to buy goods ` +
          `for a cancelled order.`
      )
    }
  }

  /**
   * Resolve the supplier variant id for each fulfillment item.
   * Source of truth: variant metadata `cj_vid` (set by the catalog sync).
   * Path: fulfillment item -> order line item -> product variant -> metadata.
   */
  protected async resolveSupplierVids(
    lineItemIds: string[]
  ): Promise<Map<string, string>> {
    const { data: lineItems } = await this.resolveQuery().graph({
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
    const { data: variants } = await this.resolveQuery().graph({
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

    // Idempotency: a second call for the same order must never place a second
    // supplier order. CJ charges per order and ships per order, so a retry, a
    // double-submit or a replayed workflow would cost real money and send the
    // customer a duplicate parcel. The order's own metadata is the record.
    await this.assertNotAlreadyPlaced(order)

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

    const payload = buildCJOrderPayload(order, data, lines)

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
    //
    // This used to log a warning and return {} — which meant Medusa recorded
    // the cancel as successful while the supplier order stayed live and
    // shippable. Throwing is the honest behaviour: the admin sees a failure and
    // knows to cancel in the CJ dashboard.
    const cjOrderId = data.cj_order_id
    this.logger_.warn(
      `CJ fulfillment: cancel requested for supplier order ${cjOrderId} — ` +
        `cancel manually in the CJ dashboard; Medusa cannot cancel it via API`
    )
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `CJ cannot cancel supplier order ${cjOrderId} via API. ` +
        `Cancel it in the CJ dashboard, then mark the fulfilment cancelled in Medusa.`
    )
  }

  /**
   * CJ does not expose a printable label/document endpoint, only tracking
   * numbers. Returning a `{ tracking_number }` object here was misleading:
   * callers expect label/PDF artefacts. Return an empty list and let tracking
   * flow through the fulfilment label instead.
   */
  async getFulfillmentDocuments(
    _data: Record<string, unknown>
  ): Promise<any> {
    return []
  }
}

export default CJFulfillmentService