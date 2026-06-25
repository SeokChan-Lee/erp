package com.axiserp.purchase;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SupplierRepository extends JpaRepository<SupplierEntity, Long>, JpaSpecificationExecutor<SupplierEntity> {

    boolean existsByCode(String code);

    boolean existsByBusinessNumber(String businessNumber);

    boolean existsByBusinessNumberAndIdNot(String businessNumber, Long id);
}
