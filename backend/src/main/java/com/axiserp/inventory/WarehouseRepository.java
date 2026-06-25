package com.axiserp.inventory;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarehouseRepository extends JpaRepository<WarehouseEntity, Long> {

    List<WarehouseEntity> findAllByOrderByIdAsc();
}
