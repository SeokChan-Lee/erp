package com.axiserp.organization.api;

import com.axiserp.auth.AuthService;
import com.axiserp.organization.DepartmentRepository;
import com.axiserp.permission.Permission;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}

