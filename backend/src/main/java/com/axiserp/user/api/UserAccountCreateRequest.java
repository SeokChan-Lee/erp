package com.axiserp.user.api;

import com.axiserp.user.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserAccountCreateRequest(
        @NotBlank String username,
        @NotBlank @Size(min = 4) String password,
        @NotNull Long employeeId,
        @NotNull @Size(min = 1) Set<Role> roles
) {
}
