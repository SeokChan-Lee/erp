package com.axiserp.inventory.api;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.inventory.InventoryMovementEntity;
import com.axiserp.inventory.InventoryMovementRepository;
import com.axiserp.inventory.InventoryStockEntity;
import com.axiserp.inventory.InventoryStockRepository;
import com.axiserp.inventory.ItemEntity;
import com.axiserp.inventory.ItemRepository;
import com.axiserp.inventory.WarehouseEntity;
import com.axiserp.inventory.WarehouseRepository;
import com.axiserp.permission.Permission;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final AuthService authService;
    private final ItemRepository itemRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryMovementRepository inventoryMovementRepository;

    public InventoryController(
            AuthService authService,
            ItemRepository itemRepository,
            WarehouseRepository warehouseRepository,
            InventoryStockRepository inventoryStockRepository,
            InventoryMovementRepository inventoryMovementRepository
    ) {
        this.authService = authService;
        this.itemRepository = itemRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryStockRepository = inventoryStockRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
    }

    @GetMapping("/warehouses")
    @Transactional(readOnly = true)
    public List<WarehouseResponse> warehouses(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.INVENTORY_READ);
        return warehouseRepository.findAllByOrderByIdAsc().stream()
                .map(WarehouseResponse::from)
                .toList();
    }

    @GetMapping("/stocks")
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> stocks(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long warehouseId
    ) {
        authService.requirePermission(sessionId, Permission.INVENTORY_READ);
        return inventoryStockRepository.findAll(stockSpecification(search, warehouseId), Sort.by("item.sku").ascending())
                .stream()
                .map(InventoryStockResponse::from)
                .toList();
    }

    @GetMapping("/overview")
    @Transactional(readOnly = true)
    public InventoryOverviewResponse overview(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.INVENTORY_READ);
        List<ItemEntity> items = itemRepository.findAll();
        long belowSafetyStocks = inventoryStockRepository.findAll().stream()
                .filter((stock) -> stock.getQuantity() < stock.getItem().getSafetyStock())
                .count();
        return new InventoryOverviewResponse(
                items.size(),
                items.stream().filter(ItemEntity::isActive).count(),
                belowSafetyStocks,
                warehouseRepository.count()
        );
    }

    @PostMapping("/adjustments")
    @Transactional
    public InventoryStockResponse adjust(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody InventoryAdjustmentRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.INVENTORY_ADJUST);
        if (request.quantityDelta() == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조정 수량은 0일 수 없습니다.");
        }

        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "품목을 찾을 수 없습니다."));
        if (!item.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성 품목은 재고 조정을 할 수 없습니다.");
        }
        WarehouseEntity warehouse = warehouseRepository.findById(request.warehouseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "창고를 찾을 수 없습니다."));

        InventoryStockEntity stock = inventoryStockRepository
                .findByItem_IdAndWarehouse_Id(item.getId(), warehouse.getId())
                .orElseGet(() -> new InventoryStockEntity(item, warehouse, 0));
        int nextQuantity = stock.getQuantity() + request.quantityDelta();
        if (nextQuantity < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "재고 수량은 0보다 작을 수 없습니다.");
        }
        stock.adjust(request.quantityDelta());
        InventoryStockEntity savedStock = inventoryStockRepository.save(stock);
        inventoryMovementRepository.save(new InventoryMovementEntity(
                item,
                warehouse,
                request.quantityDelta(),
                request.reason().trim(),
                user.username()
        ));
        return InventoryStockResponse.from(savedStock);
    }

    private Specification<InventoryStockEntity> stockSpecification(String search, Long warehouseId) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var item = root.join("item", JoinType.INNER);
            var warehouse = root.join("warehouse", JoinType.INNER);

            if (warehouseId != null) {
                predicates.add(builder.equal(warehouse.get("id"), warehouseId));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(item.get("sku")), keyword),
                        builder.like(builder.lower(item.get("name")), keyword),
                        builder.like(builder.lower(item.get("category")), keyword),
                        builder.like(builder.lower(warehouse.get("name")), keyword)
                ));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }
}
