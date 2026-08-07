package com.axiserp.permission.api;

import com.axiserp.permission.Permission;
import com.axiserp.user.Role;

import java.util.Set;

public record RolePermissionResponse(
        Role role,
        Set<Permission> permissions,
        Set<Permission> defaultPermissions
) {
}
