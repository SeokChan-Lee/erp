package com.axiserp.organization.api;

import com.axiserp.organization.DepartmentEntity;

public record DepartmentResponse(
        Long id,
        String code,
        String name,
        String description
) {
    public static DepartmentResponse from(DepartmentEntity department) {
        return new DepartmentResponse(
                department.getId(),
                department.getCode(),
                department.getName(),
                department.getDescription()
        );
    }
}

