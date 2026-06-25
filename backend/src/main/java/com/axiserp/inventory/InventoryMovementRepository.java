package com.axiserp.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovementEntity, Long>, JpaSpecificationExecutor<InventoryMovementEntity> {

    long countByProcessedAtBetween(LocalDateTime start, LocalDateTime end);

    List<InventoryMovementEntity> findTop5ByOrderByProcessedAtDescIdDesc();
}
