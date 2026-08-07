insert into role_permissions (role, permission)
select role, permission
from (
    select 'ADMIN' as role, 'ATTENDANCE_READ_SELF' as permission
    union all select 'HR_MANAGER', 'ATTENDANCE_READ_SELF'
) next_permissions
where not exists (
    select 1
    from role_permissions
    where role_permissions.role = next_permissions.role
      and role_permissions.permission = next_permissions.permission
);
