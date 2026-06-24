create table if not exists app_user_roles (
    user_id bigint not null,
    role varchar(40) not null,
    primary key (user_id, role),
    constraint fk_app_user_roles_user foreign key (user_id) references app_users (id)
);

insert into app_user_roles (user_id, role)
select id, 'SUPER_ADMIN'
from app_users
where username = 'admin'
  and not exists (
      select 1
      from app_user_roles
      where app_user_roles.user_id = app_users.id
        and app_user_roles.role = 'SUPER_ADMIN'
  );

insert into app_user_roles (user_id, role)
select id, 'EMPLOYEE'
from app_users
where username = 'employee'
  and not exists (
      select 1
      from app_user_roles
      where app_user_roles.user_id = app_users.id
        and app_user_roles.role = 'EMPLOYEE'
  );
