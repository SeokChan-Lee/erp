package com.axiserp.inventory;

public enum InventoryMovementSourceType {
    PURCHASE_RECEIPT("구매 입고"),
    PURCHASE_RECEIPT_CANCEL("구매 입고 취소"),
    SALES_SHIPMENT("판매 출고"),
    SALES_SHIPMENT_CANCEL("판매 출고 취소"),
    MANUAL_ADJUSTMENT("수동 조정");

    private final String label;

    InventoryMovementSourceType(String label) {
        this.label = label;
    }

    public String label() {
        return label;
    }
}
