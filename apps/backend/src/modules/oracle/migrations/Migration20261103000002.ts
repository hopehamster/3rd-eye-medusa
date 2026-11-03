import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Rename the profile columns to what the ORM actually emits.
 *
 * Medusa's generated CRUD builds statements from the model property names for
 * this entity ("column \"customerId\" of relation \"expert_user_profile\" does not
 * exist" on insert, "column e0.customerId does not exist" on filter), so the
 * snake_case columns the original migration created could never be read or
 * written. Renaming them to the camelCase the ORM expects makes reads, filters,
 * inserts and deletes all work — verified end to end against the live API.
 *
 * The unique index is rebuilt on the new names.
 */
export class Migration20261103000002 extends Migration {
  async up(): Promise<void> {
    this.addSql('drop index if exists "IDX_expert_user_profile_customer_expert";')
    this.addSql(
      'alter table if exists "expert_user_profile" rename column if exists "customer_id" to "customerId";'
    )
    this.addSql(
      'alter table if exists "expert_user_profile" rename column if exists "expert_id" to "expertId";'
    )
    this.addSql(
      'create unique index if not exists "IDX_expert_user_profile_customer_expert" ' +
        'on "expert_user_profile" ("customerId", "expertId");'
    )
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_expert_user_profile_customer_expert";')
    this.addSql(
      'alter table if exists "expert_user_profile" rename column if exists "customerId" to "customer_id";'
    )
    this.addSql(
      'alter table if exists "expert_user_profile" rename column if exists "expertId" to "expert_id";'
    )
  }
}
