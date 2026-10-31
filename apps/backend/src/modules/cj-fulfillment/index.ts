/**
 * CJ fulfillment provider module.
 *
 * Auto-places dropship orders with the supplier when Medusa creates a
 * fulfillment, and syncs tracking back. Shoppers never see the supplier
 * name — checkout shipping options are generic ("Standard", "Express").
 *
 * Variant -> supplier mapping lives on variant metadata:
 *   metadata: { cj_vid: "<CJ variant id>", cj_pid: "<CJ product id>" }
 *
 * Env:
 *   CJ_API_KEY   - CJ API key (from CJ account > API)
 *   CJ_EMAIL     - CJ account email (used for token auth)
 *
 * NOTE: endpoint field names follow the CJ Open API 2.0 docs. Verify the
 * exact payload against https://developers.cjdropshipping.com before going
 * live — CJ occasionally renames fields.
 */
import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import CJFulfillmentService from "./service"

export const CJ_FULFILLMENT_MODULE = "cj_fulfillment"

// Fulfillment providers use ModuleProvider (not Module) — the fulfillment
// module wires up the services array as providers.
export default ModuleProvider(Modules.FULFILLMENT, {
  services: [CJFulfillmentService],
})
