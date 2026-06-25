package com.axiserp.purchase.api;

import com.axiserp.auth.AuthService;
import com.axiserp.common.api.PageResponse;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.PurchaseOrderEntity;
import com.axiserp.purchase.PurchaseOrderRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    public PurchaseOrderController(AuthService authService, PurchaseOrderRepository purchaseOrderRepository) {
        this.authService = authService;
        this.purchaseOrderRepository = purchaseOrderRepository;
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
