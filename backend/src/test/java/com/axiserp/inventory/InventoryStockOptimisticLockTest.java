package com.axiserp.inventory;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.RollbackException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class InventoryStockOptimisticLockTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Test
    void rejectsSecondUpdateBasedOnStaleStock() {
        Long stockId = createStock();
        EntityManager firstManager = entityManagerFactory.createEntityManager();
        EntityManager secondManager = entityManagerFactory.createEntityManager();

        try {
            firstManager.getTransaction().begin();
            secondManager.getTransaction().begin();
            InventoryStockEntity firstStock = firstManager.find(InventoryStockEntity.class, stockId);
            InventoryStockEntity secondStock = secondManager.find(InventoryStockEntity.class, stockId);

            firstStock.adjust(1);
            firstManager.getTransaction().commit();

            secondStock.adjust(2);
            assertThatThrownBy(secondManager.getTransaction()::commit)
                    .isInstanceOf(RollbackException.class);
        } finally {
            rollbackIfActive(firstManager);
            rollbackIfActive(secondManager);
            firstManager.close();
            secondManager.close();
        }
    }

    private Long createStock() {
        EntityManager manager = entityManagerFactory.createEntityManager();
        try {
            manager.getTransaction().begin();
            ItemEntity item = new ItemEntity("LOCK-ITEM", "동시성 테스트 품목", "테스트", "개", 1);
            WarehouseEntity warehouse = new WarehouseEntity("LOCK-WH", "동시성 테스트 창고");
            manager.persist(item);
            manager.persist(warehouse);
            InventoryStockEntity stock = new InventoryStockEntity(item, warehouse, 10);
            manager.persist(stock);
            manager.getTransaction().commit();
            return stock.getId();
        } finally {
            rollbackIfActive(manager);
            manager.close();
        }
    }

    private void rollbackIfActive(EntityManager manager) {
        if (manager.getTransaction().isActive()) {
            manager.getTransaction().rollback();
        }
    }
}
