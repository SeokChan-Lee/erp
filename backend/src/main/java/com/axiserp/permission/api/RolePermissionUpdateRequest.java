package com.axiserp.permission.api;

import com.axiserp.permission.Permission;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record RolePermissionUpdateRequest(
        @NotNull @Size(min = 1) Set<Permission> permissions
) {
}
