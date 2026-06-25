package com.axiserp.customer.api;

import com.axiserp.customer.CustomerEntity;

public record CustomerResponse(
        Long id,
        String code,
        String name,
        String businessNumber,
        String contactName,
        String phone,
        String email,
        boolean active
) {
    public static CustomerResponse from(CustomerEntity customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getCode(),
                customer.getName(),
                customer.getBusinessNumber(),
                customer.getContactName(),
                customer.getPhone(),
                customer.getEmail(),
                customer.isActive()
        );
    }
}
