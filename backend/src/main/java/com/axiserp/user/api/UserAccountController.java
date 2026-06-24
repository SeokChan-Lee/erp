package com.axiserp.user.api;

import com.axiserp.auth.AuthService;
import com.axiserp.employee.EmployeeEntity;
import com.axiserp.employee.EmployeeRepository;
import com.axiserp.organization.DepartmentEntity;
import com.axiserp.organization.DepartmentRepository;
import com.axiserp.permission.Permission;
import com.axiserp.user.Role;
import com.axiserp.user.UserAccountEntity;
import com.axiserp.user.UserAccountRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
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

    public UserAccountController(
            AuthService authService,
            UserAccountRepository userAccountRepository,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository
    ) {
        this.authService = authService;
        this.userAccountRepository = userAccountRepository;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<UserAccountResponse> users(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.USER_READ);
        return userAccountRepository.findAllByOrderByIdAsc().stream()
                .map(UserAccountResponse::from)
                .toList();
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
                request.password(),
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
                request.password(),
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
        authService.requirePermission(sessionId, Permission.USER_UPDATE);
        UserAccountEntity account = userAccountRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 계정을 찾을 수 없습니다."));
        account.updateRoles(orderedRoles(request.roles()));
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
}
