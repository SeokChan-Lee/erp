package com.axiserp.inventory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface InventoryStockRepository extends JpaRepository<InventoryStockEntity, Long>, JpaSpecificationExecutor<InventoryStockEntity> {

    Optional<InventoryStockEntity> findByItem_IdAndWarehouse_Id(Long itemId, Long warehouseId);
}
