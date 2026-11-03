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
  /** CJ requires both spellings; omit either and it reports that one as empty. */
  shippingCustomerName: string
  customerName: string
  emailAddress?: string
  /** Country the goods ship FROM — CJ requires it and rejects the order without it. */
  fromCountryCode: string
  /** CJ requires BOTH of these; omit either and it reports that one as empty. */
  shippingCountry: string
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

export interface CJProductSummary {
  id: string
  nameEn?: string
  sku?: string
  bigImage?: string
  sellPrice?: string
  listedNum?: number
  warehouseInventoryNum?: number
}

export interface CJVariant {
  vid?: string
  variantSku?: string
  variantNameEn?: string
  variantSellPrice?: string
  variantKey?: string
}

export interface CJProductDetail {
  id: string
  nameEn?: string
  description?: string
  bigImage?: string
  images?: string[]
  variants?: CJVariant[]
}

export interface CJInventoryEntry {
  countryCode?: string
  totalInventoryNum?: number
  cjInventoryNum?: number
}