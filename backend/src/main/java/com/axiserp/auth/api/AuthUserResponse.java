package com.axiserp.auth.api;

import com.axiserp.permission.Permission;
import com.axiserp.user.Role;

import java.util.Set;

public record AuthUserResponse(
        String username,
        String displayName,
        Set<Role> roles,
        Set<Permission> permissions
) {
}
