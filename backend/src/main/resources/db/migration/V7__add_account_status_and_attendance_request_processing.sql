alter table app_users
    add column if not exists active boolean not null default true;

alter table attendance_change_requests
    add column if not exists processed_at timestamp;

alter table attendance_change_requests
    add column if not exists processed_by varchar(80);

alter table attendance_change_requests
    add column if not exists reject_reason varchar(1000);
