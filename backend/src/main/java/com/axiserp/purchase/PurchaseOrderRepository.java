package com.axiserp.purchase;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrderEntity, Long> {

    boolean existsByRequestId(Long requestId);
}
