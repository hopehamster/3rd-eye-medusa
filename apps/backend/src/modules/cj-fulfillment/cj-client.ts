/**
 * Thin CJ Open API 2.0 client.
 * Auth: POST /authentication/getAccessToken { email, apiKey }.
 * Token is cached in memory until expiry (with a 5-minute safety margin).
 */
import { MedusaError } from "@medusajs/framework/utils"
import type { CJModuleOptions, CJOrderPayload, CJOrderResult } from "./types"

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
    if (!options.apiKey || !options.email) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "CJ fulfillment: CJ_API_KEY and CJ_EMAIL must be configured."
      )
    }
    this.apiKey = options.apiKey
    this.email = options.email
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
    const body = (await (
      await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email, apiKey: this.apiKey }),
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
}
