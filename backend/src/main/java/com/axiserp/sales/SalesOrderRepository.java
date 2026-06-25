package com.axiserp.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SalesOrderRepository extends JpaRepository<SalesOrderEntity, Long>, JpaSpecificationExecutor<SalesOrderEntity> {
}
