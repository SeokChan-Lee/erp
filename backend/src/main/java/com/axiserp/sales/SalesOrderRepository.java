package com.axiserp.sales;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface SalesOrderRepository extends JpaRepository<SalesOrderEntity, Long>, JpaSpecificationExecutor<SalesOrderEntity> {

    long countByStatus(SalesOrderStatus status);

    long countByStatusAndShippedAtIsNull(SalesOrderStatus status);

    long countByOrderedAtBetween(LocalDateTime start, LocalDateTime end);

    List<SalesOrderEntity> findTop5ByOrderByOrderedAtDescIdDesc();
}
