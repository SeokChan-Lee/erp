package com.axiserp.purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrderEntity, Long>, JpaSpecificationExecutor<PurchaseOrderEntity> {

    boolean existsByRequestId(Long requestId);

    long countByReceivedAtIsNull();

    long countByOrderedAtBetween(LocalDateTime start, LocalDateTime end);

    List<PurchaseOrderEntity> findTop5ByOrderByOrderedAtDescIdDesc();
}
