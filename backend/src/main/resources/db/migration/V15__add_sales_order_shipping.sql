alter table sales_orders add column if not exists shipped_by varchar(80);
alter table sales_orders add column if not exists shipped_at timestamp;
alter table sales_orders add column if not exists shipped_warehouse_id bigint;

alter table sales_orders
    add constraint if not exists fk_sales_orders_shipped_warehouse
    foreign key (shipped_warehouse_id) references warehouses (id);
