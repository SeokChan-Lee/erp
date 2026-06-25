package com.axiserp.purchase.api;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.common.api.PageResponse;
import com.axiserp.inventory.ItemEntity;
import com.axiserp.inventory.ItemRepository;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.PurchaseRequestEntity;
import com.axiserp.purchase.PurchaseRequestRepository;
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

    public PurchaseRequestController(
            AuthService authService,
            SupplierRepository supplierRepository,
            ItemRepository itemRepository,
            PurchaseRequestRepository purchaseRequestRepository
    ) {
        this.authService = authService;
        this.supplierRepository = supplierRepository;
        this.itemRepository = itemRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<PurchaseRequestResponse> requests(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search
    ) {
        authService.requirePermission(sessionId, Permission.PURCHASE_READ);
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("requestedAt").descending().and(Sort.by("id").descending())
        );
        return PageResponse.from(purchaseRequestRepository.findAll(requestSpecification(search), pageRequest), PurchaseRequestResponse::from);
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
        return PurchaseRequestResponse.from(saved);
    }

    private Specification<PurchaseRequestEntity> requestSpecification(String search) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var supplier = root.join("supplier", JoinType.INNER);
            var item = root.join("item", JoinType.INNER);

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
