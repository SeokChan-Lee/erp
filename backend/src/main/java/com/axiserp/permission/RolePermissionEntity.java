package com.axiserp.permission;

import com.axiserp.user.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
        name = "role_permissions",
        uniqueConstraints = @UniqueConstraint(name = "uk_role_permissions_role_permission", columnNames = {"role", "permission"})
)
public class RolePermissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 80)
    private Permission permission;

    protected RolePermissionEntity() {
    }

    public RolePermissionEntity(Role role, Permission permission) {
        this.role = role;
        this.permission = permission;
    }

    public Long getId() {
        return id;
    }

    public Role getRole() {
        return role;
    }

    public Permission getPermission() {
        return permission;
    }
}
