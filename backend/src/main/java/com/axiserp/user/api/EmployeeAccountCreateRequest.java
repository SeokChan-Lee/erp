package com.axiserp.user.api;

import com.axiserp.employee.EmployeeStatus;
import com.axiserp.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record EmployeeAccountCreateRequest(
        @NotBlank @Size(max = 40) String employeeNo,
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Email @Size(max = 120) String email,
        @NotBlank @Size(max = 80) String positionTitle,
        @NotNull EmployeeStatus status,
        @NotNull Long departmentId,
        @NotBlank String username,
        @NotBlank @Size(min = 4) String password,
        @NotNull @Size(min = 1) Set<Role> roles
) {
}
