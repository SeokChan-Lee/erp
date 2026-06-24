package com.axiserp.user.api;

import com.axiserp.user.Role;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserAccountRolesUpdateRequest(
        @NotNull @Size(min = 1) Set<Role> roles
) {
}
