export interface CJModuleOptions {
  apiKey?: string
  email?: string
  /** Override the CJ API base URL (sandbox/testing). */
  baseUrl?: string
  /** Dry-run: log the order payload instead of calling CJ. Default true. */
  dryRun?: boolean
}

export interface CJOrderLine {
  vid: string
  quantity: number
}

export interface CJOrderPayload {
  externalOrderNumber: string
  customerName: string
  emailAddress?: string
  shippingCountryCode: string
  shippingProvince?: string
  shippingCity?: string
  shippingAddress: string
  shippingAddress2?: string
  shippingZip?: string
  shippingPhone?: string
  products: CJOrderLine[]
  logisticName?: string
  remark?: string
}

export interface CJOrderResult {
  orderId: string
  orderNumber?: string
}
