package com.axiserp.user.api;

import com.axiserp.employee.EmployeeEntity;
import com.axiserp.user.Role;
import com.axiserp.user.UserAccountEntity;

import java.util.Set;

public record UserAccountResponse(
        Long id,
        String username,
        String displayName,
        EmployeeSummary employee,
        Set<Role> roles
) {
    public static UserAccountResponse from(UserAccountEntity account) {
        return new UserAccountResponse(
                account.getId(),
                account.getUsername(),
                account.getDisplayName(),
                EmployeeSummary.from(account.getEmployee()),
                account.getRoles()
        );
    }

    public record EmployeeSummary(
            Long id,
            String employeeNo,
            String displayName,
            String departmentName,
            String positionTitle
    ) {
        public static EmployeeSummary from(EmployeeEntity employee) {
            if (employee == null) {
                return null;
            }
            return new EmployeeSummary(
                    employee.getId(),
                    employee.getEmployeeNo(),
                    employee.getDisplayName(),
                    employee.getDepartment().getName(),
                    employee.getPositionTitle()
            );
        }
    }
}
