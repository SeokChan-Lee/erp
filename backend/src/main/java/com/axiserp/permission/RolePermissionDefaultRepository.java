package com.axiserp.permission;

import com.axiserp.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionDefaultRepository extends JpaRepository<RolePermissionDefaultEntity, Long> {

    List<RolePermissionDefaultEntity> findByRole(Role role);

    void deleteByRole(Role role);
}
