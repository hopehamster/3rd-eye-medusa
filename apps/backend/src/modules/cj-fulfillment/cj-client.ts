/**
 * Thin CJ Open API 2.0 client.
 * Auth: POST /authentication/getAccessToken { email, apiKey }.
 * Token is cached in memory until expiry (with a 5-minute safety margin).
 */
import { MedusaError } from "@medusajs/framework/utils"
import type {
  CJModuleOptions,
  CJOrderPayload,
  CJOrderResult,
  CJProductSummary,
  CJProductDetail,
  CJVariant,
  CJInventoryEntry,
} from "./types"

const DEFAULT_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1"

interface TokenResponse {
  code: number
  message: string
  data?: {
    accessToken: string
    accessTokenExpiryDate: string
    refreshToken?: string
  }
}

export class CJClient {
  private baseUrl: string
  private apiKey: string
  private email: string
  private token: string | null = null
  private tokenExpiresAt = 0
  private logger?: { info: (m: string) => void; warn: (m: string) => void }

  constructor(
    options: CJModuleOptions,
    logger?: { info: (m: string) => void; warn: (m: string) => void }
  ) {
    if (!options.apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "CJ fulfillment: CJ_API_KEY must be configured."
      )
    }
    this.apiKey = options.apiKey
    this.email = options.email ?? ""
    this.baseUrl = options.baseUrl || DEFAULT_BASE_URL
    this.logger = logger
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { "CJ-Access-Token": this.token } : {}),
        ...(init.headers || {}),
      },
    })
    const body = (await res.json().catch(() => ({}))) as {
      code?: number
      message?: string
      data?: T
    }
    if (!res.ok || (body.code !== undefined && body.code !== 200)) {
      throw new MedusaError(
        MedusaError.Types.DB_ERROR,
        `CJ API error ${path}: ${body.code ?? res.status} ${body.message ?? ""}`.trim()
      )
    }
    return body.data as T
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt - 5 * 60 * 1000) {
      return this.token
    }
    // NOTE (verified 2026-10-13 against the live API): getAccessToken takes
    // only `apiKey`. Two quirks: (1) never send a field named `email` — the
    // endpoint's validator rejects the request with "email must be not
    // empty" whenever that field is present, even with a value; (2) the body
    // must contain a second field alongside apiKey or the same broken
    // validation path triggers. The extra field is ignored by CJ.
    const body = (await (
      await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: this.apiKey, client: "3rd-eye-supply" }),
      })
    ).json()) as TokenResponse
    if (body.code !== 200 || !body.data?.accessToken) {
      throw new MedusaError(
        MedusaError.Types.UNAUTHORIZED,
        `CJ auth failed: ${body.code} ${body.message}`
      )
    }
    this.token = body.data.accessToken
    this.tokenExpiresAt = new Date(body.data.accessTokenExpiryDate).getTime()
    this.logger?.info("CJ fulfillment: refreshed access token")
    return this.token
  }

  /** Create a dropship order. Idempotent per externalOrderNumber on CJ's side. */
  async createOrder(payload: CJOrderPayload): Promise<CJOrderResult> {
    await this.getToken()
    return this.request<CJOrderResult>("/shopping/order/createOrder", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  /** Fetch order detail incl. tracking info. */
  async getOrderDetail(orderId: string): Promise<{
    trackingNumber?: string
    logisticName?: string
    orderStatus?: string
  }> {
    await this.getToken()
    return this.request(
      `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(orderId)}`
    )
  }

  /** Track a shipment by tracking number. */
  async trackShipment(trackNumber: string): Promise<unknown> {
    await this.getToken()
    return this.request(
      `/logistics/trackInfo?trackNumber=${encodeURIComponent(trackNumber)}`
    )
  }

  /** Search the CJ catalog (listV2). Used by the product discovery job. */
  async searchProducts(params: {
    keyWord: string
    page?: number
    size?: number
    countryCode?: string
    startSellPrice?: string
    endSellPrice?: string
    orderBy?: number
    sort?: "asc" | "desc"
  }): Promise<CJProductSummary[]> {
    await this.getToken()
    // Use /product/list with productNameEn (listV2 with keyWord returns empty)
    const q = new URLSearchParams({
      productNameEn: params.keyWord,
      pageNum: String(params.page ?? 1),
      pageSize: String(params.size ?? 20),
    })
    // CJ returns pid / productImage / listingCount, and productImage is a
    // JSON-encoded array string. Normalise here so callers get real ids and
    // images instead of undefined fields.
    const asString = (v: unknown) => (typeof v === "string" ? v : undefined)
    const imageList = (v: unknown): string[] => {
      if (typeof v === "string") {
        const t = v.trim()
        if (t.startsWith("[")) {
          try {
            const parsed = JSON.parse(t)
            if (Array.isArray(parsed)) {
              return parsed.filter((x): x is string => typeof x === "string")
            }
          } catch {
            // not JSON — treat as a single url below
          }
        }
        return t ? [t] : []
      }
      if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
      return []
    }

    const data = await this.request<{ list?: Record<string, unknown>[] }>(
      `/product/list?${q.toString()}`
    )
    return (data.list ?? []).map((row) => ({
      id: String(row.pid ?? ""),
      nameEn: asString(row.productNameEn),
      sku: asString(row.productSku),
      bigImage: imageList(row.productImage)[0],
      sellPrice: asString(row.sellPrice),
      listedNum: typeof row.listingCount === "number" ? row.listingCount : undefined,
    }))
  }

  /** Full product detail incl. variants. */
  async getProduct(pid: string): Promise<CJProductDetail> {
    await this.getToken()
    const imageList = (v: unknown): string[] => {
      if (typeof v === "string") {
        const t = v.trim()
        if (t.startsWith("[")) {
          try {
            const parsed = JSON.parse(t)
            if (Array.isArray(parsed)) {
              return parsed.filter((x): x is string => typeof x === "string")
            }
          } catch {
            // not JSON — treat as a single url below
          }
        }
        return t ? [t] : []
      }
      if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
      return []
    }

    // /product/query answers with pid, productNameEn, bigImage and
    // productImageSet (or a JSON-encoded productImage) — not the id/images
    // names declared on the DTO.
    const raw = await this.request<Record<string, unknown>>(
      `/product/query?pid=${encodeURIComponent(pid)}`
    )
    const gallery = raw.productImageSet
      ? imageList(raw.productImageSet)
      : imageList(raw.productImage)
    return {
      id: String(raw.pid ?? pid),
      nameEn: typeof raw.productNameEn === "string" ? raw.productNameEn : undefined,
      description:
        typeof raw.description === "string" ? raw.description : undefined,
      bigImage:
        typeof raw.bigImage === "string" ? raw.bigImage : gallery[0],
      images: gallery,
      variants: Array.isArray(raw.variants)
        ? (raw.variants as CJVariant[])
        : [],
    }
  }

  /** Inventory per warehouse for a product. */
  async getInventory(pid: string): Promise<CJInventoryEntry[]> {
    await this.getToken()
    const data = await this.request<{ list?: CJInventoryEntry[] }>(
      `/product/stock/getInventoryByPid?pid=${encodeURIComponent(pid)}`
    )
    return data.list ?? []
  }
}
