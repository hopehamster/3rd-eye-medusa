/**
 * Daily CJ product discovery.
 * Runs the cj-product-discovery workflow every morning — finds new
 * metaphysical products on CJ, imports winners as DRAFTS for human review.
 * Nothing publishes automatically, ever.
 */
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { cjProductDiscoveryWorkflow } from "../workflows/cj-product-discovery"

export default async function cjProductDiscoveryJob(
  container: MedusaContainer
) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info("CJ discovery job: starting daily product discovery")
  try {
    const { result } = await cjProductDiscoveryWorkflow(container).run()
    logger.info(
      `CJ discovery job: done — ${result.imported.length} drafts imported`
    )
  } catch (e) {
    logger.error(`CJ discovery job failed: ${(e as Error).message}`)
  }
}

export const config = {
  name: "cj-product-discovery",
  schedule: "0 6 * * *",
}
