package com.axiserp.purchase.api;

import com.axiserp.purchase.SupplierEntity;

public record SupplierResponse(
        Long id,
        String code,
        String name,
        String businessNumber,
        String contactName,
        String phone,
        String email,
        boolean active
) {
    public static SupplierResponse from(SupplierEntity supplier) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getCode(),
                supplier.getName(),
                supplier.getBusinessNumber(),
                supplier.getContactName(),
                supplier.getPhone(),
                supplier.getEmail(),
                supplier.isActive()
        );
    }
}
