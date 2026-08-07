package com.axiserp.auth;

import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.auth.api.LoginRequest;
import com.axiserp.employee.EmployeeEntity;
import com.axiserp.permission.Permission;
import com.axiserp.permission.RolePermissionEntity;
import com.axiserp.permission.RolePermissionDefaultEntity;
import com.axiserp.permission.RolePermissionDefaultRepository;
import com.axiserp.permission.RolePermissionRepository;
import com.axiserp.user.Role;
import com.axiserp.user.UserAccountEntity;
import com.axiserp.user.UserAccountRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
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
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class AuthService {

    public static final String COOKIE_NAME = "axis_session";

    private final Map<String, Session> sessions = new ConcurrentHashMap<>();
    private final Map<Role, Set<Permission>> rolePermissions = new EnumMap<>(Role.class);
    private final Map<Role, Set<Permission>> roleDefaultPermissions = new EnumMap<>(Role.class);
    private final UserAccountRepository userAccountRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final RolePermissionDefaultRepository rolePermissionDefaultRepository;
    private final PasswordService passwordService;
    private final Duration sessionDuration;

    public AuthService(
            UserAccountRepository userAccountRepository,
            RolePermissionRepository rolePermissionRepository,
            RolePermissionDefaultRepository rolePermissionDefaultRepository,
            PasswordService passwordService,
            @Value("${axis.auth.session-duration:PT12H}") Duration sessionDuration
    ) {
        this.userAccountRepository = userAccountRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.rolePermissionDefaultRepository = rolePermissionDefaultRepository;
        this.passwordService = passwordService;
        this.sessionDuration = sessionDuration;
    }

    @PostConstruct
    void initialize() {
        Map<Role, Set<Permission>> defaults = defaultRolePermissions();
        // Early migrations add a small set of permissions before application seeding.
        // Treat that migration-only state like an empty installation.
        if (userAccountRepository.count() == 0 && rolePermissionRepository.count() <= 15) {
            rolePermissionRepository.deleteAllInBatch();
            defaults.forEach((role, permissions) -> rolePermissionRepository.saveAll(
                    permissions.stream()
                            .map((permission) -> new RolePermissionEntity(role, permission))
                            .toList()
            ));
        }
        refreshRolePermissions(defaults);
        if (rolePermissionDefaultRepository.count() == 0) {
            rolePermissions.forEach((role, permissions) -> rolePermissionDefaultRepository.saveAll(
                    permissions.stream()
                            .map((permission) -> new RolePermissionDefaultEntity(role, permission))
                            .toList()
            ));
        }
        refreshRoleDefaultPermissions();
    }

    @Transactional
    public LoginResult login(LoginRequest request) {
        UserAccountEntity account = userAccountRepository.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "비활성화된 계정입니다. 관리자에게 문의해 주세요.");
        }
        if (!passwordService.matches(request.password(), account.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        if (passwordService.needsUpgrade(account.getPassword())) {
            account.updatePassword(passwordService.encode(request.password()));
        }

        String sessionId = UUID.randomUUID().toString();
        sessions.put(sessionId, new Session(account.getUsername(), Instant.now().plus(sessionDuration)));
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
        String username = sessionUsername(sessionId);
        if (username == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        UserAccountEntity account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."));
        if (!account.isActive()) {
            sessions.remove(sessionId);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return toAuthUser(account);
    }

    @Transactional(readOnly = true)
    public Optional<AuthUserResponse> optionalUser(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(sessionUsername(sessionId))
                .flatMap(userAccountRepository::findByUsername)
                .filter(UserAccountEntity::isActive)
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

    public Set<Permission> defaultPermissionsFor(Role role) {
        return roleDefaultPermissions.getOrDefault(role, Set.of());
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

    @Transactional
    public Set<Permission> updateRoleDefaultPermissions(Role role, Set<Permission> permissions) {
        if (role == Role.SUPER_ADMIN) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "최고 관리자 권한은 모든 권한으로 고정됩니다.");
        }
        if (permissions == null || permissions.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "역할 초기값에는 최소 1개 이상의 권한이 필요합니다.");
        }

        Set<Permission> orderedPermissions = orderedPermissions(permissions);
        rolePermissionDefaultRepository.deleteByRole(role);
        rolePermissionDefaultRepository.flush();
        rolePermissionDefaultRepository.saveAll(
                orderedPermissions.stream()
                        .map((permission) -> new RolePermissionDefaultEntity(role, permission))
                        .toList()
        );
        roleDefaultPermissions.put(role, orderedPermissions);
        return orderedPermissions;
    }

    private AuthUserResponse toAuthUser(UserAccountEntity account) {
        Set<Permission> permissions = EnumSet.noneOf(Permission.class);
        for (Role role : account.getRoles()) {
            permissions.addAll(rolePermissions.getOrDefault(role, Set.of()));
        }
        return new AuthUserResponse(account.getUsername(), account.getDisplayName(), toEmployeeProfile(account.getEmployee()), account.getRoles(), permissions);
    }

    private AuthUserResponse.EmployeeProfile toEmployeeProfile(EmployeeEntity employee) {
        if (employee == null) {
            return null;
        }

        return new AuthUserResponse.EmployeeProfile(
                employee.getId(),
                employee.getEmployeeNo(),
                employee.getDisplayName(),
                employee.getEmail(),
                employee.getPositionTitle(),
                employee.getStatus().name(),
                employee.getDepartment().getId(),
                employee.getDepartment().getCode(),
                employee.getDepartment().getName()
        );
    }

    public record LoginResult(String sessionId, AuthUserResponse user) {
    }

    private String sessionUsername(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return null;
        }
        Session session = sessions.get(sessionId);
        if (session == null) {
            return null;
        }
        if (session.expiresAt().isBefore(Instant.now())) {
            sessions.remove(sessionId, session);
            return null;
        }
        return session.username();
    }

    private record Session(String username, Instant expiresAt) {
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

    private void refreshRoleDefaultPermissions() {
        roleDefaultPermissions.clear();
        for (Role role : Role.values()) {
            Set<Permission> persisted = rolePermissionDefaultRepository.findByRole(role).stream()
                    .map(RolePermissionDefaultEntity::getPermission)
                    .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permission.class)));
            roleDefaultPermissions.put(role, orderedPermissions(persisted));
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
                Permission.DEPARTMENT_CREATE,
                Permission.EMPLOYEE_CREATE,
                Permission.EMPLOYEE_UPDATE,
                Permission.ATTENDANCE_READ_SELF,
                Permission.ATTENDANCE_READ_ALL,
                Permission.ATTENDANCE_SETTINGS_UPDATE
        )));
        defaults.put(Role.HR_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.EMPLOYEE_READ,
                Permission.DEPARTMENT_CREATE,
                Permission.EMPLOYEE_CREATE,
                Permission.EMPLOYEE_UPDATE,
                Permission.ATTENDANCE_READ_SELF,
                Permission.ATTENDANCE_READ_ALL,
                Permission.ATTENDANCE_UPDATE,
                Permission.ATTENDANCE_APPROVE,
                Permission.ATTENDANCE_SETTINGS_UPDATE
        )));
        defaults.put(Role.SALES_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.CUSTOMER_READ,
                Permission.CUSTOMER_CREATE,
                Permission.CUSTOMER_UPDATE,
                Permission.ITEM_READ,
                Permission.INVENTORY_READ,
                Permission.SALES_READ,
                Permission.SALES_CREATE,
                Permission.SALES_UPDATE
        )));
        defaults.put(Role.PURCHASE_MANAGER, orderedPermissions(EnumSet.of(
                Permission.DASHBOARD_VIEW,
                Permission.SUPPLIER_READ,
                Permission.SUPPLIER_CREATE,
                Permission.SUPPLIER_UPDATE,
                Permission.ITEM_READ,
                Permission.INVENTORY_READ,
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
                Permission.WAREHOUSE_CREATE,
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
