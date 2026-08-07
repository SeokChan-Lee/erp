package com.axiserp.permission.api;

import com.axiserp.auth.AuthService;
import com.axiserp.permission.Permission;
import com.axiserp.user.Role;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
public class RolePermissionController {

    private final AuthService authService;

    public RolePermissionController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public List<RolePermissionResponse> roles(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.ROLE_READ);
        return Arrays.stream(Role.values())
                .map(this::response)
                .toList();
    }

    @PatchMapping("/{role}/permissions")
    public RolePermissionResponse update(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Role role,
            @Valid @RequestBody RolePermissionUpdateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.ROLE_UPDATE);
        authService.updateRolePermissions(role, request.permissions());
        return response(role);
    }

    @PatchMapping("/{role}/default-permissions")
    public RolePermissionResponse updateDefault(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Role role,
            @Valid @RequestBody RolePermissionUpdateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.ROLE_UPDATE);
        authService.updateRoleDefaultPermissions(role, request.permissions());
        return response(role);
    }

    private RolePermissionResponse response(Role role) {
        return new RolePermissionResponse(
                role,
                authService.permissionsFor(role),
                authService.defaultPermissionsFor(role)
        );
    }
}
