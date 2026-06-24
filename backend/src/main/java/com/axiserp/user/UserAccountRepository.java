package com.axiserp.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccountEntity, Long>, JpaSpecificationExecutor<UserAccountEntity> {

    List<UserAccountEntity> findAllByOrderByIdAsc();

    Optional<UserAccountEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmployee_Id(Long employeeId);
}
