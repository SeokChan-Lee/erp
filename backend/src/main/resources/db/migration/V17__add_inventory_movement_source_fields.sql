alter table inventory_movements
    add column if not exists source_type varchar(40) not null default 'MANUAL_ADJUSTMENT';

alter table inventory_movements
    add column if not exists source_reference_no varchar(80) not null default '';

update inventory_movements
set source_type = case
        when reason like '구매 발주 입고 취소:%' then 'PURCHASE_RECEIPT_CANCEL'
        when reason like '구매 발주 입고:%' then 'PURCHASE_RECEIPT'
        when reason like '판매 수주 출고 취소:%' then 'SALES_SHIPMENT_CANCEL'
        when reason like '판매 수주 출고:%' then 'SALES_SHIPMENT'
        else 'MANUAL_ADJUSTMENT'
    end,
    source_reference_no = case
        when locate(':', reason) > 0 then trim(substring(reason, locate(':', reason) + 1))
        else ''
    end;
