package com.axiserp.sales.api;

import com.axiserp.customer.api.CustomerResponse;
import com.axiserp.inventory.api.ItemResponse;
import com.axiserp.inventory.api.WarehouseResponse;
import com.axiserp.sales.SalesOrderEntity;
import com.axiserp.sales.SalesOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SalesOrderResponse(
        Long id,
        String orderNo,
        CustomerResponse customer,
        ItemResponse item,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount,
        SalesOrderStatus status,
        String memo,
        String orderedBy,
        LocalDateTime orderedAt,
        String processedBy,
        LocalDateTime processedAt,
        WarehouseResponse shippedWarehouse,
        String shippedBy,
        LocalDateTime shippedAt
) {
    public static SalesOrderResponse from(SalesOrderEntity order) {
        return new SalesOrderResponse(
                order.getId(),
                order.getOrderNo(),
                CustomerResponse.from(order.getCustomer()),
                ItemResponse.from(order.getItem()),
                order.getQuantity(),
                order.getUnitPrice(),
                order.getUnitPrice().multiply(BigDecimal.valueOf(order.getQuantity())),
                order.getStatus(),
                order.getMemo(),
                order.getOrderedBy(),
                order.getOrderedAt(),
                order.getProcessedBy(),
                order.getProcessedAt(),
                order.getShippedWarehouse() == null ? null : WarehouseResponse.from(order.getShippedWarehouse()),
                order.getShippedBy(),
                order.getShippedAt()
        );
    }
}
