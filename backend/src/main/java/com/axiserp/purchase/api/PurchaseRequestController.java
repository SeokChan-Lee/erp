package com.axiserp.purchase.api;

import com.axiserp.audit.AuditLogService;
import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.common.api.PageResponse;
import com.axiserp.inventory.ItemEntity;
import com.axiserp.inventory.ItemRepository;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.PurchaseOrderEntity;
import com.axiserp.purchase.PurchaseOrderRepository;
import com.axiserp.purchase.PurchaseRequestEntity;
import com.axiserp.purchase.PurchaseRequestRepository;
import com.axiserp.purchase.PurchaseRequestStatus;
import com.axiserp.purchase.SupplierEntity;
import com.axiserp.purchase.SupplierRepository;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/purchases/requests")
public class PurchaseRequestController {

    private final AuthService authService;
    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditLogService auditLogService;

    public PurchaseRequestController(
            AuthService authService,
            SupplierRepository supplierRepository,
            ItemRepository itemRepository,
            PurchaseRequestRepository purchaseRequestRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            AuditLogService auditLogService
    ) {
        this.authService = authService;
        this.supplierRepository = supplierRepository;
        this.itemRepository = itemRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestResponse> requests(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status
    ) {
        authService.requirePermission(sessionId, Permission.PURCHASE_READ);
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("requestedAt").descending().and(Sort.by("id").descending())
        );
        return PageResponse.from(purchaseRequestRepository.findAll(requestSpecification(search, status), pageRequest), PurchaseRequestResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PurchaseRequestResponse create(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody PurchaseRequestCreateRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.PURCHASE_CREATE);
        SupplierEntity supplier = supplierRepository.findById(request.supplierId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "공급사를 찾을 수 없습니다."));
        if (!supplier.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성 공급사로는 구매 요청을 생성할 수 없습니다.");
        }
        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "품목을 찾을 수 없습니다."));
        if (!item.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성 품목으로는 구매 요청을 생성할 수 없습니다.");
        }
        String requestNo = "PR-" + LocalDate.now().toString().replace("-", "") + "-" + System.currentTimeMillis();
        PurchaseRequestEntity saved = purchaseRequestRepository.save(new PurchaseRequestEntity(
                requestNo,
                supplier,
                item,
                request.quantity(),
                request.unitPrice(),
                request.memo() == null ? null : request.memo().trim(),
                user.displayName()
        ));
        auditLogService.record(
                "PURCHASE",
                "PURCHASE_REQUEST_CREATE",
                saved.getRequestNo(),
                "구매 요청 생성",
                "%s · %s · 수량 %d".formatted(supplier.getName(), item.getName(), request.quantity()),
                user.displayName()
        );
        return PurchaseRequestResponse.from(saved);
    }

    @PatchMapping("/{id}/approve")
    @Transactional
    public PurchaseRequestResponse approve(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.PURCHASE_APPROVE);
        PurchaseRequestEntity request = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구매 요청을 찾을 수 없습니다."));
        try {
            request.approve(user.displayName());
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
        auditLogService.record(
                "PURCHASE",
                "PURCHASE_REQUEST_APPROVE",
                request.getRequestNo(),
                "구매 요청 승인",
                "%s · %s".formatted(request.getSupplier().getName(), request.getItem().getName()),
                user.displayName()
        );
        return PurchaseRequestResponse.from(request);
    }

    @PatchMapping("/{id}/cancel")
    @Transactional
    public PurchaseRequestResponse cancel(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.PURCHASE_UPDATE);
        PurchaseRequestEntity request = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구매 요청을 찾을 수 없습니다."));
        try {
            request.cancel(user.displayName());
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
        auditLogService.record(
                "PURCHASE",
                "PURCHASE_REQUEST_CANCEL",
                request.getRequestNo(),
                "구매 요청 취소",
                "%s · %s".formatted(request.getSupplier().getName(), request.getItem().getName()),
                user.displayName()
        );
        return PurchaseRequestResponse.from(request);
    }

    @PostMapping("/{id}/order")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public PurchaseOrderResponse order(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.PURCHASE_UPDATE);
        PurchaseRequestEntity request = purchaseRequestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "구매 요청을 찾을 수 없습니다."));
        if (purchaseOrderRepository.existsByRequestId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 발주로 전환된 구매 요청입니다.");
        }
        try {
            request.markOrdered(user.displayName());
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
        String orderNo = "PO-" + LocalDate.now().toString().replace("-", "") + "-" + System.currentTimeMillis();
        PurchaseOrderEntity order = purchaseOrderRepository.save(new PurchaseOrderEntity(orderNo, request, user.displayName()));
        auditLogService.record(
                "PURCHASE",
                "PURCHASE_ORDER_CREATE",
                order.getOrderNo(),
                "구매 발주 전환",
                "%s · 요청 %s".formatted(request.getSupplier().getName(), request.getRequestNo()),
                user.displayName()
        );
        return PurchaseOrderResponse.from(order);
    }

    private Specification<PurchaseRequestEntity> requestSpecification(String search, String status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var supplier = root.join("supplier", JoinType.INNER);
            var item = root.join("item", JoinType.INNER);

            if (!"ALL".equals(status)) {
                try {
                    predicates.add(builder.equal(root.get("status"), PurchaseRequestStatus.valueOf(status)));
                } catch (IllegalArgumentException exception) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "구매 요청 상태 값을 확인해 주세요.");
                }
            }

            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("requestNo")), keyword),
                        builder.like(builder.lower(supplier.get("name")), keyword),
                        builder.like(builder.lower(item.get("sku")), keyword),
                        builder.like(builder.lower(item.get("name")), keyword),
                        builder.like(builder.lower(root.get("memo")), keyword),
                        builder.like(builder.lower(root.get("requestedBy")), keyword)
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
