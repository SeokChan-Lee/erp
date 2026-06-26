insert into role_permissions (role, permission)
select role, permission
from (
    select 'SUPER_ADMIN' as role, 'WAREHOUSE_CREATE' as permission
    union all select 'ADMIN', 'WAREHOUSE_CREATE'
    union all select 'INVENTORY_MANAGER', 'WAREHOUSE_CREATE'
) next_permissions
where not exists (
    select 1
    from role_permissions
    where role_permissions.role = next_permissions.role
      and role_permissions.permission = next_permissions.permission
);
