insert into role_permissions (role, permission)
select 'PURCHASE_MANAGER', 'ITEM_READ'
where not exists (
    select 1 from role_permissions where role = 'PURCHASE_MANAGER' and permission = 'ITEM_READ'
);

insert into role_permissions (role, permission)
select 'PURCHASE_MANAGER', 'INVENTORY_READ'
where not exists (
    select 1 from role_permissions where role = 'PURCHASE_MANAGER' and permission = 'INVENTORY_READ'
);

insert into role_permissions (role, permission)
select 'SALES_MANAGER', 'ITEM_READ'
where not exists (
    select 1 from role_permissions where role = 'SALES_MANAGER' and permission = 'ITEM_READ'
);

insert into role_permissions (role, permission)
select 'SALES_MANAGER', 'INVENTORY_READ'
where not exists (
    select 1 from role_permissions where role = 'SALES_MANAGER' and permission = 'INVENTORY_READ'
);
