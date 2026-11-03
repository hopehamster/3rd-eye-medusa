import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds the soft-delete column to the other two Oracle tables.
 *
 * Same class of bug as expert_user_profile: Medusa models carry `deleted_at` by
 * default, so every generated query filters on it, and the hand-written
 * migrations that created these tables never added the column. That is why
 * listOracleMessages / listOracleLogs threw and the Oracle kept no log of what
 * it was asked.
 */
export class Migration20261103000001 extends Migration {
  async up(): Promise<void> {
    for (const table of ["oracle_log", "oracle_message"]) {
      this.addSql(
        `alter table if exists "${table}" add column if not exists "deleted_at" timestamptz null;`
      )
    }
  }

  async down(): Promise<void> {
    for (const table of ["oracle_log", "oracle_message"]) {
      this.addSql(`alter table if exists "${table}" drop column if exists "deleted_at";`)
    }
  }
}
