package com.axiserp.auth;

import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.auth.api.LoginRequest;
import com.axiserp.permission.Permission;
import com.axiserp.permission.RolePermissionEntity;
import com.axiserp.permission.RolePermissionRepository;
import com.axiserp.user.Role;
import com.axiserp.user.UserAccountEntity;
import com.axiserp.user.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthService {

    public static final String COOKIE_NAME = "axis_session";

    private final Map<String, String> sessions = new ConcurrentHashMap<>();
    private final Map<Role, Set<Permission>> rolePermissions = new EnumMap<>(Role.class);
    private final UserAccountRepository userAccountRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public AuthService(UserAccountRepository userAccountRepository, RolePermissionRepository rolePermissionRepository) {
        this.userAccountRepository = userAccountRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @PostConstruct
    void initialize() {
        Map<Role, Set<Permission>> defaults = defaultRolePermissions();
        if (rolePermissionRepository.count() == 0) {
            defaults.forEach((role, permissions) -> rolePermissionRepository.saveAll(
                    permissions.stream()
                            .map((permission) -> new RolePermissionEntity(role, permission))
                            .toList()
            ));
        }
        refreshRolePermissions(defaults);
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request) {
        UserAccountEntity account = userAccountRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!account.getPassword().equals(request.password())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, account.getUsername());
        return new LoginResult(sessionId, toAuthUser(account));
    }

    public void logout(String sessionId) {
        sessions.remove(sessionId);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse currentUser(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        String username = sessions.get(sessionId);
        if (username == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        UserAccountEntity account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."));
        return toAuthUser(account);
    }

    @Transactional(readOnly = true)
    public Optional<AuthUserResponse> optionalUser(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(sessions.get(sessionId))
                .flatMap(userAccountRepository::findByUsername)
                .map(this::toAuthUser);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse requirePermission(String sessionId, Permission permission) {
        AuthUserResponse user = currentUser(sessionId);
        if (!user.permissions().contains(permission)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "요청한 작업을 수행할 권한이 없습니다.");
        }
        return user;
    }

    public Set<Permission> permissionsFor(Role role) {
        return rolePermissions.getOrDefault(role, Set.of());
    }

    @Transactional
    public Set<Permission> updateRolePermissions(Role role, Set<Permission> permissions) {
        if (role == Role.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "최고 관리자 권한은 모든 권한으로 고정됩니다.");
        }
        if (permissions == null || permissions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할에는 최소 1개 이상의 권한이 필요합니다.");
        }

        Set<Permission> orderedPermissions = orderedPermissions(permissions);
        rolePermissionRepository.deleteByRole(role);
        rolePermissionRepository.flush();
        rolePermissionRepository.saveAll(
                orderedPermissions.stream()
                        .map((permission) -> new RolePermissionEntity(role, permission))
                        .toList()
        );
        rolePermissions.put(role, orderedPermissions);
        return orderedPermissions;
    }

    private AuthUserResponse toAuthUser(UserAccountEntity account) {
        Set<Permission> permissions = EnumSet.noneOf(Permission.class);
        for (Role role : account.getRoles()) {
            permissions.addAll(rolePermissions.getOrDefault(role, Set.of()));
        }
        return new AuthUserResponse(account.getUsername(), account.getDisplayName(), account.getRoles(), permissions);
    }

    public record LoginResult(String sessionId, AuthUserResponse user) {
    }

    private void refreshRolePermissions(Map<Role, Set<Permission>> defaults) {
        rolePermissions.clear();
        for (Role role : Role.values()) {
            Set<Permission> savedPermissions = rolePermissionRepository.findByRole(role).stream()
                    .map(RolePermissionEntity::getPermission)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            rolePermissions.put(role, savedPermissions.isEmpty()
                    ? defaults.getOrDefault(role, Set.of())
                    : orderedPermissions(savedPermissions));
        }
    }

    private Map<Role, Set<Permission>> defaultRolePermissions() {
        Map<Role, Set<Permission>> defaults = new EnumMap<>(Role.class);
        defaults.put(Role.SUPER_ADMIN, orderedPermissions(EnumSet.allOf(Permission.class)));
        defaults.put(Role.ADMIN, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.USER_READ,
                Permission.USER_CREATE,
                Permission.USER_UPDATE,
                Permission.ROLE_READ,
                Permission.ROLE_UPDATE,
                Permission.EMPLOYEE_READ,
                Permission.EMPLOYEE_CREATE,
                Permission.EMPLOYEE_UPDATE,
                Permission.ATTENDANCE_READ_ALL
        )));
        defaults.put(Role.HR_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.EMPLOYEE_READ,
                Permission.EMPLOYEE_CREATE,
                Permission.EMPLOYEE_UPDATE,
                Permission.ATTENDANCE_READ_ALL,
                Permission.ATTENDANCE_UPDATE,
                Permission.ATTENDANCE_APPROVE
        )));
        defaults.put(Role.SALES_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.CUSTOMER_READ,
                Permission.CUSTOMER_CREATE,
                Permission.CUSTOMER_UPDATE,
                Permission.SALES_READ,
                Permission.SALES_CREATE,
                Permission.SALES_UPDATE
        )));
        defaults.put(Role.PURCHASE_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.SUPPLIER_READ,
                Permission.SUPPLIER_CREATE,
                Permission.SUPPLIER_UPDATE,
                Permission.PURCHASE_READ,
                Permission.PURCHASE_CREATE,
                Permission.PURCHASE_UPDATE,
                Permission.PURCHASE_APPROVE
        )));
        defaults.put(Role.INVENTORY_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.ITEM_READ,
                Permission.ITEM_CREATE,
                Permission.ITEM_UPDATE,
                Permission.INVENTORY_READ,
                Permission.INVENTORY_MOVE,
                Permission.INVENTORY_ADJUST
        )));
        defaults.put(Role.APPROVER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.APPROVAL_READ,
                Permission.APPROVAL_PROCESS
        )));
        defaults.put(Role.EMPLOYEE, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.ATTENDANCE_CHECK_IN,
                Permission.ATTENDANCE_CHECK_OUT,
                Permission.ATTENDANCE_READ_SELF
        )));
        defaults.put(Role.VIEWER, orderedPermissions(EnumSet.of(Permission.DASHBOARD_VIEW)));
        return defaults;
    }

    private Set<Permission> orderedPermissions(Set<Permission> permissions) {
        return permissions.stream()
                .sorted((left, right) -> Integer.compare(left.ordinal(), right.ordinal()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
