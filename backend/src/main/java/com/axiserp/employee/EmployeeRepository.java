package com.axiserp.employee;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<EmployeeEntity, Long> {

    Optional<EmployeeEntity> findByEmployeeNo(String employeeNo);

    boolean existsByEmployeeNo(String employeeNo);
}
