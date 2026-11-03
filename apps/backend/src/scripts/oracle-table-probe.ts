import type { ExecArgs } from "@medusajs/framework/types"
import { ORACLE_MODULE } from "../modules/oracle"

/**
 * Diagnose why the Oracle's own tables cannot be read.
 *
 * The generated CRUD (listExpertUserProfiles, listOracleMessages) throws
 * "column e0.<camelCase> does not exist", which means the ORM is not mapping the
 * camelCase properties onto the snake_case columns the migration created.
 * Print what each shape of call actually does so the fix is evidence-based
 * rather than another guess.
 */
export default async function oracleTableProbe({ container }: ExecArgs) {
  const oracle = container.resolve(ORACLE_MODULE) as any
  const tries: [string, () => Promise<unknown>][] = [
    ["listExpertUserProfiles({})", () => oracle.listExpertUserProfiles({})],
    ["listExpertUserProfiles({ customerId })", () => oracle.listExpertUserProfiles({ customerId: "cus_x" })],
    ["listExpertUserProfiles({ customer_id })", () => oracle.listExpertUserProfiles({ customer_id: "cus_x" } as any)],
    ["listOracleMessages({})", () => oracle.listOracleMessages({})],
    ["listOracleLogs({})", () => oracle.listOracleLogs({})],
  ]
  for (const [label, fn] of tries) {
    try {
      const rows = await fn()
      console.log("OK  ", label, "->", Array.isArray(rows) ? rows.length + " rows" : typeof rows)
    } catch (e) {
      console.log("FAIL", label, "->", (e as Error).message.slice(0, 140))
    }
  }
}
