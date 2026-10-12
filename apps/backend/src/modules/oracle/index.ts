import { Module } from "@medusajs/framework/utils"
import OracleModuleService from "./service"

export const ORACLE_MODULE = "oracle"

export default Module(ORACLE_MODULE, {
  service: OracleModuleService,
})
