package com.axiserp.employee.api;

import com.axiserp.employee.EmployeeEntity;
import com.axiserp.employee.EmployeeStatus;

public record EmployeeResponse(
        Long id,
        String employeeNo,
        String displayName,
        String email,
        String positionTitle,
        EmployeeStatus status,
        DepartmentSummary department
) {
    public static EmployeeResponse from(EmployeeEntity employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getEmployeeNo(),
                employee.getDisplayName(),
                employee.getEmail(),
                employee.getPositionTitle(),
                employee.getStatus(),
                new DepartmentSummary(
                        employee.getDepartment().getId(),
                        employee.getDepartment().getCode(),
                        employee.getDepartment().getName()
                )
        );
    }

    public record DepartmentSummary(Long id, String code, String name) {
    }
}

