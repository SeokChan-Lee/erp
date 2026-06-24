package com.axiserp.user.api;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.auth.PasswordService;
import com.axiserp.common.api.PageResponse;
import com.axiserp.employee.EmployeeEntity;
import com.axiserp.employee.EmployeeRepository;
import com.axiserp.organization.DepartmentEntity;
import com.axiserp.organization.DepartmentRepository;
import com.axiserp.permission.Permission;
import com.axiserp.user.Role;
import com.axiserp.user.UserAccountEntity;
import com.axiserp.user.UserAccountRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserAccountController {

    private final AuthService authService;
    private final UserAccountRepository userAccountRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordService passwordService;

    public UserAccountController(
            AuthService authService,
            UserAccountRepository userAccountRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            PasswordService passwordService
    ) {
        this.authService = authService;
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.passwordService = passwordService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<UserAccountResponse> users(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(required = false) Role role
    ) {
        authService.requirePermission(sessionId, Permission.USER_READ);
        PageRequest pageRequest = PageRequest.of(normalizedPage(page), normalizedPageSize(pageSize), Sort.by("id").ascending());
        return PageResponse.from(userAccountRepository.findAll(userSpecification(search, status, role), pageRequest), UserAccountResponse::from);
    }

    @GetMapping("/available-employees")
    @Transactional(readOnly = true)
    public List<AvailableEmployeeResponse> availableEmployees(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.USER_READ);
        return employeeRepository.findAll().stream()
                .filter((employee) -> !userAccountRepository.existsByEmployee_Id(employee.getId()))
                .map(AvailableEmployeeResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public UserAccountResponse create(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody UserAccountCreateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.USER_CREATE);
        if (userAccountRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다.");
        }
        EmployeeEntity employee = employeeRepository.findById(request.employeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "직원을 찾을 수 없습니다."));
        if (userAccountRepository.existsByEmployee_Id(employee.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 로그인 계정이 연결된 직원입니다.");
        }

        UserAccountEntity account = userAccountRepository.save(new UserAccountEntity(
                request.username(),
                passwordService.encode(request.password()),
                employee.getDisplayName(),
                employee,
                orderedRoles(request.roles())
        ));
        return UserAccountResponse.from(account);
    }

    @PostMapping("/employee-account")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public UserAccountResponse createEmployeeAccount(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody EmployeeAccountCreateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.EMPLOYEE_CREATE);
        authService.requirePermission(sessionId, Permission.USER_CREATE);
        if (employeeRepository.existsByEmployeeNo(request.employeeNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 직원 번호입니다.");
        }
        if (userAccountRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 아이디입니다.");
        }

        DepartmentEntity department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "부서를 찾을 수 없습니다."));
        EmployeeEntity employee = employeeRepository.save(new EmployeeEntity(
                request.employeeNo(),
                request.displayName(),
                request.email(),
                request.positionTitle(),
                request.status(),
                department
        ));
        UserAccountEntity account = userAccountRepository.save(new UserAccountEntity(
                request.username(),
                passwordService.encode(request.password()),
                employee.getDisplayName(),
                employee,
                orderedRoles(request.roles())
        ));
        return UserAccountResponse.from(account);
    }

    @PatchMapping("/{id}/roles")
    @Transactional
    public UserAccountResponse updateRoles(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id,
            @Valid @RequestBody UserAccountRolesUpdateRequest request
    ) {
        AuthUserResponse currentUser = authService.requirePermission(sessionId, Permission.USER_UPDATE);
        UserAccountEntity account = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 계정을 찾을 수 없습니다."));
        Set<Role> nextRoles = orderedRoles(request.roles());
        validateSelfRoleChange(currentUser, account, nextRoles);
        account.updateRoles(nextRoles);
        return UserAccountResponse.from(account);
    }

    @PatchMapping("/{id}")
    @Transactional
    public UserAccountResponse update(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id,
            @Valid @RequestBody UserAccountUpdateRequest request
    ) {
        AuthUserResponse currentUser = authService.requirePermission(sessionId, Permission.USER_UPDATE);
        UserAccountEntity account = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 계정을 찾을 수 없습니다."));

        if (request.password() != null && !request.password().isBlank()) {
            account.updatePassword(passwordService.encode(request.password()));
        }
        Set<Role> nextRoles = orderedRoles(request.roles());
        validateSelfRoleChange(currentUser, account, nextRoles);
        account.updateRoles(nextRoles);
        if (request.active() != null) {
            if (currentUser.username().equals(account.getUsername()) && !request.active()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 로그인한 계정은 비활성화할 수 없습니다.");
            }
            account.updateActive(request.active());
        }
        return UserAccountResponse.from(account);
    }

    private Set<Role> orderedRoles(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "사용자 계정에는 최소 1개 이상의 역할이 필요합니다.");
        }
        return roles.stream()
                .sorted(Comparator.comparingInt(Role::ordinal))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private void validateSelfRoleChange(AuthUserResponse currentUser, UserAccountEntity account, Set<Role> nextRoles) {
        if (!currentUser.username().equals(account.getUsername())) {
            return;
        }

        Set<Permission> nextPermissions = nextRoles.stream()
                .flatMap((role) -> authService.permissionsFor(role).stream())
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(Permission.class)));
        if (!nextPermissions.containsAll(currentUser.permissions())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 로그인한 계정의 권한을 줄이는 역할 변경은 할 수 없습니다.");
        }
    }

    private Specification<UserAccountEntity> userSpecification(String search, String status, Role role) {
        return (root, query, builder) -> {
            query.distinct(true);
            List<Predicate> predicates = new ArrayList<>();

            if ("ACTIVE".equals(status)) {
                predicates.add(builder.isTrue(root.get("active")));
            } else if ("INACTIVE".equals(status)) {
                predicates.add(builder.isFalse(root.get("active")));
            }

            if (role != null) {
                predicates.add(builder.equal(root.join("roles"), role));
            }

            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                var employee = root.join("employee", JoinType.LEFT);
                var department = employee.join("department", JoinType.LEFT);
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("username")), keyword),
                        builder.like(builder.lower(root.get("displayName")), keyword),
                        builder.like(builder.lower(employee.get("displayName")), keyword),
                        builder.like(builder.lower(employee.get("positionTitle")), keyword),
                        builder.like(builder.lower(department.get("name")), keyword)
                ));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private int normalizedPage(int page) {
        return Math.max(0, page - 1);
    }

    private int normalizedPageSize(int pageSize) {
        return Math.min(Math.max(pageSize, 1), 100);
    }
}
