import { Module } from "@medusajs/framework/utils"
import OracleModuleService from "./service"

export const ORACLE_MODULE = "oracle"

/**
 * Models are registered by `MedusaService({...})` inside service.ts — the
 * `models` key is not part of the Module() contract in 2.21.2.
 */
export default Module(ORACLE_MODULE, {
  service: OracleModuleService,
})
