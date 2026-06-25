package com.axiserp.sales.api;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.common.api.PageResponse;
import com.axiserp.customer.CustomerEntity;
import com.axiserp.customer.CustomerRepository;
import com.axiserp.inventory.ItemEntity;
import com.axiserp.inventory.ItemRepository;
import com.axiserp.permission.Permission;
import com.axiserp.sales.SalesOrderEntity;
import com.axiserp.sales.SalesOrderRepository;
import com.axiserp.sales.SalesOrderStatus;
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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/sales/orders")
public class SalesOrderController {

    private final AuthService authService;
    private final CustomerRepository customerRepository;
    private final ItemRepository itemRepository;
    private final SalesOrderRepository salesOrderRepository;

    public SalesOrderController(
            AuthService authService,
            CustomerRepository customerRepository,
            ItemRepository itemRepository,
            SalesOrderRepository salesOrderRepository
    ) {
        this.authService = authService;
        this.customerRepository = customerRepository;
        this.itemRepository = itemRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<SalesOrderResponse> orders(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status
    ) {
        authService.requirePermission(sessionId, Permission.SALES_READ);
        PageRequest pageRequest = PageRequest.of(
                normalizedPage(page),
                normalizedPageSize(pageSize),
                Sort.by("orderedAt").descending().and(Sort.by("id").descending())
        );
        return PageResponse.from(salesOrderRepository.findAll(orderSpecification(search, status), pageRequest), SalesOrderResponse::from);
    }

    @PostMapping
    @Transactional
    public SalesOrderResponse create(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody SalesOrderCreateRequest request
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.SALES_CREATE);
        CustomerEntity customer = customerRepository.findById(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "고객사를 찾을 수 없습니다."));
        if (!customer.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성 고객사로는 판매 수주를 등록할 수 없습니다.");
        }
        ItemEntity item = itemRepository.findById(request.itemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "품목을 찾을 수 없습니다."));
        if (!item.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비활성 품목으로는 판매 수주를 등록할 수 없습니다.");
        }

        String orderNo = "SO-" + LocalDate.now().toString().replace("-", "") + "-" + System.currentTimeMillis();
        SalesOrderEntity order = salesOrderRepository.save(new SalesOrderEntity(
                orderNo,
                customer,
                item,
                request.quantity(),
                request.unitPrice(),
                request.memo() == null ? null : request.memo().trim(),
                user.displayName()
        ));
        return SalesOrderResponse.from(order);
    }

    @PatchMapping("/{id}/cancel")
    @Transactional
    public SalesOrderResponse cancel(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id
    ) {
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.SALES_UPDATE);
        SalesOrderEntity order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "판매 수주를 찾을 수 없습니다."));
        try {
            order.cancel(user.displayName());
        } catch (IllegalStateException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, exception.getMessage());
        }
        return SalesOrderResponse.from(order);
    }

    private Specification<SalesOrderEntity> orderSpecification(String search, String status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            var customer = root.join("customer", JoinType.INNER);
            var item = root.join("item", JoinType.INNER);

            if (!"ALL".equals(status)) {
                try {
                    predicates.add(builder.equal(root.get("status"), SalesOrderStatus.valueOf(status)));
                } catch (IllegalArgumentException exception) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "판매 수주 상태 값을 확인해 주세요.");
                }
            }

            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("orderNo")), keyword),
                        builder.like(builder.lower(customer.get("code")), keyword),
                        builder.like(builder.lower(customer.get("name")), keyword),
                        builder.like(builder.lower(item.get("sku")), keyword),
                        builder.like(builder.lower(item.get("name")), keyword),
                        builder.like(builder.lower(root.get("memo")), keyword),
                        builder.like(builder.lower(root.get("orderedBy")), keyword)
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
