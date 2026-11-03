import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Adds the soft-delete column the model expects.
 *
 * Medusa models carry `deleted_at` by default, so every query through the
 * module service is rewritten to filter on it. The previous migration created
 * the table without that column, so reads kept throwing
 * "column e0.deleted_at does not exist" and both call sites swallowed it — the
 * Oracle still never remembered anything, one bug deeper than the one the
 * previous migration fixed.
 */
export class Migration20261103000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "expert_user_profile" ' +
        'add column if not exists "deleted_at" timestamptz null;'
    )
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "expert_user_profile" drop column if exists "deleted_at";'
    )
  }
}
