package com.axiserp.organization.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentCreateRequest(
        @NotBlank @Size(max = 40) String code,
        @NotBlank @Size(max = 100) String name,
        @Size(max = 255) String description
) {
}
