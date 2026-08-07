alter table inventory_stocks
    add column if not exists version bigint not null default 0;

alter table purchase_orders
    add column if not exists version bigint not null default 0;

alter table sales_orders
    add column if not exists version bigint not null default 0;
