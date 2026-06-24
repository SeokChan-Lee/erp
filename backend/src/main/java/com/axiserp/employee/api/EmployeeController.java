package com.axiserp.employee.api;

import com.axiserp.auth.AuthService;
import com.axiserp.employee.EmployeeEntity;
import com.axiserp.employee.EmployeeRepository;
import com.axiserp.permission.Permission;
import com.axiserp.organization.DepartmentEntity;
import com.axiserp.organization.DepartmentRepository;
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

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final AuthService authService;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeController(
            AuthService authService,
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository
    ) {
        this.authService = authService;
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<EmployeeResponse> employees(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.EMPLOYEE_READ);
        return employeeRepository.findAll().stream()
                .map(EmployeeResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public EmployeeResponse create(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody EmployeeCreateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.EMPLOYEE_CREATE);
        if (employeeRepository.existsByEmployeeNo(request.employeeNo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 직원 번호입니다.");
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
        return EmployeeResponse.from(employee);
    }

    @PatchMapping("/{id}")
    @Transactional
    public EmployeeResponse update(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.EMPLOYEE_UPDATE);
        EmployeeEntity employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "직원을 찾을 수 없습니다."));
        DepartmentEntity department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "부서를 찾을 수 없습니다."));
        employee.update(
                request.displayName(),
                request.email(),
                request.positionTitle(),
                request.status(),
                department
        );
        return EmployeeResponse.from(employee);
    }
}
