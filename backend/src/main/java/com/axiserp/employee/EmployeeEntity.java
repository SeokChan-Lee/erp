package com.axiserp.employee;

import com.axiserp.organization.DepartmentEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "employees")
public class EmployeeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String employeeNo;

    @Column(nullable = false, length = 100)
    private String displayName;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 80)
    private String positionTitle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private DepartmentEntity department;

    protected EmployeeEntity() {
    }

    public EmployeeEntity(
            String employeeNo,
            String displayName,
            String email,
            String positionTitle,
            EmployeeStatus status,
            DepartmentEntity department
    ) {
        this.employeeNo = employeeNo;
        this.displayName = displayName;
        this.email = email;
        this.positionTitle = positionTitle;
        this.status = status;
        this.department = department;
    }

    public Long getId() {
        return id;
    }

    public String getEmployeeNo() {
        return employeeNo;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getPositionTitle() {
        return positionTitle;
    }

    public EmployeeStatus getStatus() {
        return status;
    }

    public DepartmentEntity getDepartment() {
        return department;
    }

    public void update(
            String displayName,
            String email,
            String positionTitle,
            EmployeeStatus status,
            DepartmentEntity department
    ) {
        this.displayName = displayName;
        this.email = email;
        this.positionTitle = positionTitle;
        this.status = status;
        this.department = department;
    }
}
