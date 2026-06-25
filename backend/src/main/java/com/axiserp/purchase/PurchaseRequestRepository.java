package com.axiserp.purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequestEntity, Long>, JpaSpecificationExecutor<PurchaseRequestEntity> {
}
