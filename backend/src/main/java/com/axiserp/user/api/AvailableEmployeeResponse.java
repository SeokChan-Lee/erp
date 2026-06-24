package com.axiserp.user.api;

import com.axiserp.employee.EmployeeEntity;
import com.axiserp.employee.EmployeeStatus;

public record AvailableEmployeeResponse(
        Long id,
        String employeeNo,
        String displayName,
        String positionTitle,
        EmployeeStatus status,
        DepartmentSummary department
) {
    public static AvailableEmployeeResponse from(EmployeeEntity employee) {
        return new AvailableEmployeeResponse(
                employee.getId(),
                employee.getEmployeeNo(),
                employee.getDisplayName(),
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
