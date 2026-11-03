import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Rename the profile columns to what the ORM actually emits.
 *
 * The table used snake_case, but the generated CRUD builds statements from the
 * model property names ("column customerId of relation expert_user_profile does
 * not exist" on insert), so nothing could be read or written. Renaming to
 * camelCase makes reads, filters, inserts and deletes all work.
 *
 * PostgreSQL has no "rename column if exists", so both renames are guarded by a
 * catalogue check inside a DO block. That also makes this a no-op on a database
 * where the rename was applied by hand, which is the case in production.
 */
export class Migration20261103000002 extends Migration {
  async up(): Promise<void> {
    this.addSql(`do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'expert_user_profile' and column_name = 'customer_id') then
    alter table "expert_user_profile" rename column "customer_id" to "customerId";
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'expert_user_profile' and column_name = 'expert_id') then
    alter table "expert_user_profile" rename column "expert_id" to "expertId";
  end if;
end $$;`)
    this.addSql(
      'create unique index if not exists "IDX_expert_user_profile_customer_expert" ' +
        'on "expert_user_profile" ("customerId", "expertId");'
    )
  }

  async down(): Promise<void> {
    this.addSql(`do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'expert_user_profile' and column_name = 'customerId') then
    alter table "expert_user_profile" rename column "customerId" to "customer_id";
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'expert_user_profile' and column_name = 'expertId') then
    alter table "expert_user_profile" rename column "expertId" to "expert_id";
  end if;
end $$;`)
  }
}
