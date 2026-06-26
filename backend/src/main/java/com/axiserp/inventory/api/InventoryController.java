package com.axiserp.inventory.api;

import com.axiserp.audit.AuditLogService;
import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.common.api.PageResponse;
import com.axiserp.inventory.InventoryMovementEntity;
import com.axiserp.inventory.InventoryMovementRepository;
import com.axiserp.inventory.InventoryMovementSourceType;
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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.time.LocalTime;
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
    private final AuditLogService auditLogService;

    public InventoryController(
            AuthService authService,
            ItemRepository itemRepository,
            WarehouseRepository warehouseRepository,
            InventoryStockRepository inventoryStockRepository,
            InventoryMovementRepository inventoryMovementRepository,
            AuditLogService auditLogService
    ) {
        this.authService = authService;
        this.itemRepository = itemRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryStockRepository = inventoryStockRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/warehouses")
    @Transactional(readOnly = true)
    public List<WarehouseResponse> warehouses(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.INVENTORY_READ);
        return warehouseRepository.findAllByOrderByIdAsc().stream()
                .map(WarehouseResponse::from)
                .toList();
    }

    @PostMapping("/warehouses")
    @Transactional
    public WarehouseResponse createWarehouse(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody WarehouseCreateRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.WAREHOUSE_CREATE);
        String code = request.code().trim().toUpperCase();
        String name = request.name().trim();
        if (warehouseRepository.existsByCodeIgnoreCase(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 창고 코드입니다.");
        }

        WarehouseEntity warehouse = warehouseRepository.save(new WarehouseEntity(code, name));
        itemRepository.findAll().forEach((item) ->
                inventoryStockRepository.save(new InventoryStockEntity(item, warehouse, 0))
        );
        auditLogService.record(
                "INVENTORY",
                "WAREHOUSE_CREATE",
                code,
                "창고 등록",
                "%s · %s".formatted(code, name),
                user.displayName()
        );
        return WarehouseResponse.from(warehouse);
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

    @GetMapping("/movements")
    @Transactional(readOnly = true)
    public PageResponse<InventoryMovementResponse> movements(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        authService.requirePermission(sessionId, Permission.INVENTORY_READ);
        if (startDate != null && endDate != null && startDate.isAfter(endDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "시작일은 종료일보다 늦을 수 없습니다.");
        }
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("processedAt").descending().and(Sort.by("id").descending())
        );
        return PageResponse.from(
                inventoryMovementRepository.findAll(movementSpecification(search, warehouseId, startDate, endDate), pageRequest),
                InventoryMovementResponse::from
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
                InventoryMovementSourceType.MANUAL_ADJUSTMENT,
                "",
                user.displayName()
        ));
        auditLogService.record(
                "INVENTORY",
                "INVENTORY_ADJUST",
                item.getSku(),
                "재고 조정",
                "%s · %s · 변경량 %d".formatted(item.getName(), warehouse.getName(), request.quantityDelta()),
                user.displayName()
        );
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

    private Specification<InventoryMovementEntity> movementSpecification(String search, Long warehouseId, LocalDate startDate, LocalDate endDate) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var item = root.join("item", JoinType.INNER);
            var warehouse = root.join("warehouse", JoinType.INNER);

            if (warehouseId != null) {
                predicates.add(builder.equal(warehouse.get("id"), warehouseId));
            }
            if (startDate != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("processedAt"), startDate.atStartOfDay()));
            }
            if (endDate != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("processedAt"), endDate.atTime(LocalTime.MAX)));
            }
            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(item.get("sku")), keyword),
                        builder.like(builder.lower(item.get("name")), keyword),
                        builder.like(builder.lower(item.get("category")), keyword),
                        builder.like(builder.lower(warehouse.get("name")), keyword),
                        builder.like(builder.lower(root.get("reason")), keyword),
                        builder.like(builder.lower(root.get("sourceReferenceNo")), keyword),
                        builder.like(builder.lower(root.get("processedBy")), keyword)
                ));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private int normalizedPage(int page) {
        return Math.max(0, page - 1);
    }

    private int normalizedPageSize(int pageSize) {
        return Math.min(Math.max(pageSize, 1), 100);
    }
}
