package com.axiserp.auth.api;

import com.axiserp.permission.Permission;
import com.axiserp.user.Role;

import java.util.Set;

public record AuthUserResponse(
        String username,
        String displayName,
        EmployeeProfile employee,
        Set<Role> roles,
        Set<Permission> permissions
) {
    public record EmployeeProfile(
            Long id,
            String employeeNo,
            String displayName,
            String email,
            String positionTitle,
            String status,
            Long departmentId,
            String departmentCode,
            String departmentName
    ) {
    }
}
