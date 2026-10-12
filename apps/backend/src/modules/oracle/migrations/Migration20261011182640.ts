import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Hand-written: the medusa CLI's db:generate cannot run in this sandbox
 * (EPERM on its telemetry config write). Re-run `medusa db:generate oracle`
 * in a normal environment before first deploy to confirm parity.
 */
export class Migration20261011182640 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "oracle_log" (` +
        `"id" text not null, ` +
        `"question" text not null, ` +
        `"intents" text[] null, ` +
        `"mode" text not null default 'guidance', ` +
        `"product_ids" text[] null, ` +
        `"helpful" boolean null, ` +
        `"needs_canon" boolean not null default false, ` +
        `"session_id" text null, ` +
        `"customer_id" text null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `constraint "oracle_log_pkey" primary key ("id"));`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "oracle_log" cascade;`)
  }
}
