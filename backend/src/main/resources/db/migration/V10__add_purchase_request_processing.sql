alter table purchase_requests add column if not exists processed_by varchar(80);
alter table purchase_requests add column if not exists processed_at timestamp;
