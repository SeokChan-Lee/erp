package com.axiserp.inventory.api;

import com.axiserp.inventory.WarehouseEntity;

public record WarehouseResponse(
        Long id,
        String code,
        String name
) {
    public static WarehouseResponse from(WarehouseEntity warehouse) {
        return new WarehouseResponse(warehouse.getId(), warehouse.getCode(), warehouse.getName());
    }
}
