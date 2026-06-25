alter table purchase_orders add column if not exists received_by varchar(80);
alter table purchase_orders add column if not exists received_at timestamp;
alter table purchase_orders add column if not exists received_warehouse_id bigint;

alter table purchase_orders
    add constraint if not exists fk_purchase_orders_received_warehouse
    foreign key (received_warehouse_id) references warehouses (id);
