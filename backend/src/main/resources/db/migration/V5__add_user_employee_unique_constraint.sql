alter table app_users
    add constraint if not exists uk_app_users_employee unique (employee_id);
