package com.axiserp.employee.api;

import com.axiserp.employee.EmployeeStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EmployeeCreateRequest(
        @NotBlank @Size(max = 40) String employeeNo,
        @NotBlank @Size(max = 100) String displayName,
        @NotBlank @Email @Size(max = 120) String email,
        @NotBlank @Size(max = 80) String positionTitle,
        @NotNull EmployeeStatus status,
        @NotNull Long departmentId
) {
}
