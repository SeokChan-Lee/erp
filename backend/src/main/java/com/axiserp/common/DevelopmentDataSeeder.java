package com.axiserp.common;

import com.axiserp.auth.PasswordService;
import com.axiserp.employee.EmployeeEntity;
import com.axiserp.employee.EmployeeRepository;
import com.axiserp.employee.EmployeeStatus;
import com.axiserp.organization.DepartmentEntity;
import com.axiserp.organization.DepartmentRepository;
import com.axiserp.user.Role;
import com.axiserp.user.UserAccountEntity;
import com.axiserp.user.UserAccountRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class DevelopmentDataSeeder implements ApplicationRunner {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordService passwordService;

    public DevelopmentDataSeeder(
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository,
            UserAccountRepository userAccountRepository,
            PasswordService passwordService
    ) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.userAccountRepository = userAccountRepository;
        this.passwordService = passwordService;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        DepartmentEntity management = departmentRepository.findByCode("MGMT")
                .orElseGet(() -> departmentRepository.save(new DepartmentEntity("MGMT", "경영관리", "관리자와 운영 관리 부서")));
        DepartmentEntity operations = departmentRepository.findByCode("OPS")
                .orElseGet(() -> departmentRepository.save(new DepartmentEntity("OPS", "운영팀", "일반 운영 담당 부서")));

        EmployeeEntity adminEmployee = employeeRepository.findByEmployeeNo("A-0001")
                .orElseGet(() -> employeeRepository.save(new EmployeeEntity(
                        "A-0001",
                        "시스템 관리자",
                        "admin@axis.local",
                        "시스템 관리자",
                        EmployeeStatus.ACTIVE,
                        management
                )));
        EmployeeEntity employee = employeeRepository.findByEmployeeNo("E-0001")
                .orElseGet(() -> employeeRepository.save(new EmployeeEntity(
                        "E-0001",
                        "운영 담당자",
                        "employee@axis.local",
                        "운영 담당자",
                        EmployeeStatus.ACTIVE,
                        operations
                )));

        if (!userAccountRepository.existsByUsername("admin")) {
            userAccountRepository.save(new UserAccountEntity(
                    "admin",
                    passwordService.encode("admin123"),
                    adminEmployee.getDisplayName(),
                    adminEmployee,
                    Set.of(Role.SUPER_ADMIN)
            ));
        }
        if (!userAccountRepository.existsByUsername("employee")) {
            userAccountRepository.save(new UserAccountEntity(
                    "employee",
                    passwordService.encode("employee123"),
                    employee.getDisplayName(),
                    employee,
                    Set.of(Role.EMPLOYEE)
            ));
        }
    }
}
