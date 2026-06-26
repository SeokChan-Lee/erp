package com.axiserp.purchase.api;

import com.axiserp.audit.AuditLogService;
import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.common.api.PageResponse;
import com.axiserp.inventory.InventoryMovementEntity;
import com.axiserp.inventory.InventoryMovementRepository;
import com.axiserp.inventory.InventoryMovementSourceType;
import com.axiserp.inventory.InventoryStockEntity;
import com.axiserp.inventory.InventoryStockRepository;
import com.axiserp.inventory.WarehouseEntity;
import com.axiserp.inventory.WarehouseRepository;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.PurchaseOrderEntity;
import com.axiserp.purchase.PurchaseOrderRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/purchases/orders")
public class PurchaseOrderController {

    private final AuthService authService;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final AuditLogService auditLogService;

    public PurchaseOrderController(
            AuthService authService,
            PurchaseOrderRepository purchaseOrderRepository,
            WarehouseRepository warehouseRepository,
            InventoryStockRepository inventoryStockRepository,
            InventoryMovementRepository inventoryMovementRepository,
            AuditLogService auditLogService
    ) {
        this.authService = authService;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryStockRepository = inventoryStockRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<PurchaseOrderResponse> orders(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        authService.requirePermission(sessionId, Permission.PURCHASE_READ);
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조회 시작일은 종료일보다 늦을 수 없습니다.");
        }
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("orderedAt").descending().and(Sort.by("id").descending())
        );
        return PageResponse.from(purchaseOrderRepository.findAll(orderSpecification(search, fromDate, toDate), pageRequest), PurchaseOrderResponse::from);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public PurchaseOrderResponse order(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id
    ) {
        authService.requirePermission(sessionId, Permission.PURCHASE_READ);
        PurchaseOrderEntity order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구매 발주를 찾을 수 없습니다."));
        return PurchaseOrderResponse.from(order);
    }

    @PostMapping("/{id}/receive")
    @Transactional
    public PurchaseOrderResponse receive(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderReceiveRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.PURCHASE_UPDATE);
        PurchaseOrderEntity order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구매 발주를 찾을 수 없습니다."));
        WarehouseEntity warehouse = warehouseRepository.findById(request.warehouseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "입고 창고를 찾을 수 없습니다."));

        try {
            order.receive(warehouse, user.displayName());
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }

        InventoryStockEntity stock = inventoryStockRepository
                .findByItem_IdAndWarehouse_Id(order.getRequest().getItem().getId(), warehouse.getId())
                .orElseGet(() -> new InventoryStockEntity(order.getRequest().getItem(), warehouse, 0));
        stock.adjust(order.getRequest().getQuantity());
        inventoryStockRepository.save(stock);
        inventoryMovementRepository.save(new InventoryMovementEntity(
                order.getRequest().getItem(),
                warehouse,
                order.getRequest().getQuantity(),
                "구매 발주 입고: " + order.getOrderNo(),
                InventoryMovementSourceType.PURCHASE_RECEIPT,
                order.getOrderNo(),
                user.displayName()
        ));
        auditLogService.record(
                "PURCHASE",
                "PURCHASE_ORDER_RECEIVE",
                order.getOrderNo(),
                "구매 발주 입고",
                "%s · %s · 수량 %d".formatted(order.getRequest().getItem().getName(), warehouse.getName(), order.getRequest().getQuantity()),
                user.displayName()
        );

        return PurchaseOrderResponse.from(order);
    }

    @PostMapping("/{id}/receive/cancel")
    @Transactional
    public PurchaseOrderResponse cancelReceive(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.PURCHASE_UPDATE);
        PurchaseOrderEntity order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구매 발주를 찾을 수 없습니다."));
        if (!order.isReceived() || order.getReceivedWarehouse() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "입고 처리되지 않은 발주입니다.");
        }

        WarehouseEntity warehouse = order.getReceivedWarehouse();
        InventoryStockEntity stock = inventoryStockRepository
                .findByItem_IdAndWarehouse_Id(order.getRequest().getItem().getId(), warehouse.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "입고 취소할 재고가 없습니다."));
        if (stock.getQuantity() < order.getRequest().getQuantity()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "입고 취소 후 재고 수량이 0보다 작아질 수 없습니다.");
        }

        stock.adjust(-order.getRequest().getQuantity());
        inventoryStockRepository.save(stock);
        inventoryMovementRepository.save(new InventoryMovementEntity(
                order.getRequest().getItem(),
                warehouse,
                -order.getRequest().getQuantity(),
                "구매 발주 입고 취소: " + order.getOrderNo(),
                InventoryMovementSourceType.PURCHASE_RECEIPT_CANCEL,
                order.getOrderNo(),
                user.displayName()
        ));
        order.cancelReceive();
        auditLogService.record(
                "PURCHASE",
                "PURCHASE_ORDER_RECEIVE_CANCEL",
                order.getOrderNo(),
                "구매 발주 입고 취소",
                "%s · %s · 수량 %d".formatted(order.getRequest().getItem().getName(), warehouse.getName(), order.getRequest().getQuantity()),
                user.displayName()
        );

        return PurchaseOrderResponse.from(order);
    }

    private Specification<PurchaseOrderEntity> orderSpecification(String search, LocalDate fromDate, LocalDate toDate) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var request = root.join("request", JoinType.INNER);
            var supplier = request.join("supplier", JoinType.INNER);
            var item = request.join("item", JoinType.INNER);

            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("orderNo")), keyword),
                        builder.like(builder.lower(root.get("orderedBy")), keyword),
                        builder.like(builder.lower(request.get("requestNo")), keyword),
                        builder.like(builder.lower(supplier.get("code")), keyword),
                        builder.like(builder.lower(supplier.get("name")), keyword),
                        builder.like(builder.lower(item.get("sku")), keyword),
                        builder.like(builder.lower(item.get("name")), keyword)
                ));
            }

            if (fromDate != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("orderedAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(builder.lessThan(root.get("orderedAt"), toDate.plusDays(1).atStartOfDay()));
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
