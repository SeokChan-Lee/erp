alter table purchase_requests
    add column if not exists processed_reason varchar(255);
