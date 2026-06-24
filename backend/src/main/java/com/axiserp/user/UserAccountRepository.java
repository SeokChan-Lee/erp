package com.axiserp.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccountEntity, Long> {

    List<UserAccountEntity> findAllByOrderByIdAsc();

    Optional<UserAccountEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmployee_Id(Long employeeId);
}
