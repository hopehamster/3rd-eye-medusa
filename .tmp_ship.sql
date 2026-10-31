\pset pager off
select so.id, so.name, so.price_type, so.provider_id is not null as has_provider,
       (select string_agg(p.currency_code || '=' || p.amount::text, ', ' order by p.currency_code)
          from price p where p.price_set_id = so.id and p.deleted_at is null) as prices
from shipping_option so where so.deleted_at is null order by so.name;

select p.currency_code, pt.name as opt_type, count(*) as n
from shipping_option so
join shipping_option_type pt on pt.id = so.shipping_option_type_id
join price p on p.price_set_id = so.id and p.deleted_at is null
where so.deleted_at is null group by 1,2 order by 1,2;