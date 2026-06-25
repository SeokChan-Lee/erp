package com.axiserp.inventory.api;

import com.axiserp.inventory.InventoryMovementEntity;

import java.time.LocalDateTime;

public record InventoryMovementResponse(
        Long id,
        ItemResponse item,
        WarehouseResponse warehouse,
        int quantityDelta,
        String reason,
        String sourceType,
        String sourceLabel,
        String sourceReferenceNo,
        String processedBy,
        LocalDateTime processedAt
) {
    public static InventoryMovementResponse from(InventoryMovementEntity movement) {
        MovementSource source = MovementSource.from(movement.getReason());
        return new InventoryMovementResponse(
                movement.getId(),
                ItemResponse.from(movement.getItem()),
                WarehouseResponse.from(movement.getWarehouse()),
                movement.getQuantityDelta(),
                movement.getReason(),
                source.type(),
                source.label(),
                source.referenceNo(),
                movement.getProcessedBy(),
                movement.getProcessedAt()
        );
    }

    private record MovementSource(String type, String label, String referenceNo) {
        private static MovementSource from(String reason) {
            String referenceNo = referenceNo(reason);
            if (reason.startsWith("구매 발주 입고 취소")) {
                return new MovementSource("PURCHASE_RECEIPT_CANCEL", "구매 입고 취소", referenceNo);
            }
            if (reason.startsWith("구매 발주 입고")) {
                return new MovementSource("PURCHASE_RECEIPT", "구매 입고", referenceNo);
            }
            if (reason.startsWith("판매 수주 출고 취소")) {
                return new MovementSource("SALES_SHIPMENT_CANCEL", "판매 출고 취소", referenceNo);
            }
            if (reason.startsWith("판매 수주 출고")) {
                return new MovementSource("SALES_SHIPMENT", "판매 출고", referenceNo);
            }
            return new MovementSource("MANUAL_ADJUSTMENT", "수동 조정", "");
        }

        private static String referenceNo(String reason) {
            int separatorIndex = reason.indexOf(":");
            if (separatorIndex < 0 || separatorIndex >= reason.length() - 1) {
                return "";
            }
            return reason.substring(separatorIndex + 1).trim();
        }
    }
}
