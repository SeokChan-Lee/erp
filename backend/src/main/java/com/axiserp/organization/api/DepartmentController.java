package com.axiserp.organization.api;

import com.axiserp.auth.AuthService;
import com.axiserp.organization.DepartmentEntity;
import com.axiserp.organization.DepartmentRepository;
import com.axiserp.permission.Permission;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final AuthService authService;
    private final DepartmentRepository departmentRepository;

    public DepartmentController(AuthService authService, DepartmentRepository departmentRepository) {
        this.authService = authService;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public List<DepartmentResponse> departments(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.EMPLOYEE_READ);
        return departmentRepository.findAll().stream()
                .map(DepartmentResponse::from)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentResponse createDepartment(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody DepartmentCreateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.DEPARTMENT_CREATE);
        String code = request.code().trim().toUpperCase();
        if (departmentRepository.findByCode(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 사용 중인 부서 코드입니다.");
        }
        DepartmentEntity department = departmentRepository.save(new DepartmentEntity(
                code,
                request.name().trim(),
                request.description() == null ? "" : request.description().trim()
        ));
        return DepartmentResponse.from(department);
    }
}
