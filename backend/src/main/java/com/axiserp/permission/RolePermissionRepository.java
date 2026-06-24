package com.axiserp.permission;

import com.axiserp.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermissionEntity, Long> {

    List<RolePermissionEntity> findByRole(Role role);

    void deleteByRole(Role role);
}
