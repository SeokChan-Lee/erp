package com.axiserp.customer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CustomerRepository extends JpaRepository<CustomerEntity, Long>, JpaSpecificationExecutor<CustomerEntity> {

    boolean existsByCode(String code);

    boolean existsByBusinessNumber(String businessNumber);

    boolean existsByBusinessNumberAndIdNot(String businessNumber, Long id);
}
