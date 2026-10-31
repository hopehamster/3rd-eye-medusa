import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds the oracle `expert_user_profile` table.
 *
 * The ExpertUserProfile model has been defined (and read/written by
 * getUserProfile / updateUserProfile) since the Oracle shipped, but no
 * migration ever created the table. Every read threw, and both call sites
 * swallow the error, so "the Oracle remembers you" silently never happened —
 * with no error visible anywhere except a missing row.
 *
 * Uniqueness is per (customer_id, expert_id): one memory per customer per
 * expert, never shared between customers or between experts.
 */
export class Migration20261101000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "expert_user_profile" (` +
        `"id" text not null, ` +
        `"customer_id" text not null, ` +
        `"expert_id" text not null, ` +
        `"profile" jsonb not null default '{}'::jsonb, ` +
        `"created_at" timestamptz not null default now(), ` +
        `"updated_at" timestamptz not null default now(), ` +
        `constraint "expert_user_profile_pkey" primary key ("id"));`
    )
    this.addSql(
      `create unique index if not exists "IDX_expert_user_profile_customer_expert" ` +
        `on "expert_user_profile" ("customer_id", "expert_id");`
    )
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "expert_user_profile" cascade;')
  }
}
