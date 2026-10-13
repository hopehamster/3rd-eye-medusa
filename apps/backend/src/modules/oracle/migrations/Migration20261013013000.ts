import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Hand-written: the medusa CLI's db:generate cannot run in this sandbox
 * (EPERM on its telemetry config write). Re-run `medusa db:generate oracle`
 * in a normal environment before first deploy to confirm parity.
 *
 * Adds the oracle_message table (conversation history) and the missing
 * oracle_log.expert_id column declared on the model.
 */
export class Migration20261013013000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "oracle_message" (` +
        `"id" text not null, ` +
        `"session_id" text not null, ` +
        `"expert_id" text not null, ` +
        `"role" text not null, ` +
        `"content" text not null, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `constraint "oracle_message_pkey" primary key ("id"));`
    )
    this.addSql(
      `create index if not exists "IDX_oracle_message_session" on "oracle_message" ("session_id", "expert_id", "created_at");`
    )
    this.addSql(
      `alter table "oracle_log" add column if not exists "expert_id" text null;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "oracle_message" cascade;`)
    this.addSql(`alter table "oracle_log" drop column if exists "expert_id";`)
  }
}
