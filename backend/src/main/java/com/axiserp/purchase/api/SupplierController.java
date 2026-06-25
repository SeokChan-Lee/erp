package com.axiserp.purchase.api;

import com.axiserp.auth.AuthService;
import com.axiserp.common.api.PageResponse;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.SupplierEntity;
import com.axiserp.purchase.SupplierRepository;
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

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final AuthService authService;
    private final SupplierRepository supplierRepository;

    public SupplierController(AuthService authService, SupplierRepository supplierRepository) {
        this.authService = authService;
        this.supplierRepository = supplierRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<SupplierResponse> suppliers(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status
    ) {
        authService.requirePermission(sessionId, Permission.SUPPLIER_READ);
        PageRequest pageRequest = PageRequest.of(normalizedPage(page), normalizedPageSize(pageSize), Sort.by("id").ascending());
        return PageResponse.from(supplierRepository.findAll(supplierSpecification(search, status), pageRequest), SupplierResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public SupplierResponse create(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody SupplierCreateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.SUPPLIER_CREATE);
        String code = request.code().trim();
        String businessNumber = request.businessNumber().trim();
        if (supplierRepository.existsByCode(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 공급사 코드입니다.");
        }
        if (supplierRepository.existsByBusinessNumber(businessNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 사업자등록번호입니다.");
        }
        SupplierEntity supplier = supplierRepository.save(new SupplierEntity(
                code,
                request.name().trim(),
                businessNumber,
                request.contactName().trim(),
                request.phone().trim(),
                request.email().trim()
        ));
        return SupplierResponse.from(supplier);
    }

    @PatchMapping("/{id}")
    @Transactional
    public SupplierResponse update(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id,
            @Valid @RequestBody SupplierUpdateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.SUPPLIER_UPDATE);
        SupplierEntity supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공급사를 찾을 수 없습니다."));
        String businessNumber = request.businessNumber().trim();
        if (supplierRepository.existsByBusinessNumberAndIdNot(businessNumber, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 사업자등록번호입니다.");
        }
        supplier.update(
                request.name().trim(),
                businessNumber,
                request.contactName().trim(),
                request.phone().trim(),
                request.email().trim(),
                request.active()
        );
        return SupplierResponse.from(supplier);
    }

    private Specification<SupplierEntity> supplierSpecification(String search, String status) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if ("ACTIVE".equals(status)) {
                predicates.add(builder.isTrue(root.get("active")));
            } else if ("INACTIVE".equals(status)) {
                predicates.add(builder.isFalse(root.get("active")));
            }

            if (search != null && !search.isBlank()) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("code")), keyword),
                        builder.like(builder.lower(root.get("name")), keyword),
                        builder.like(builder.lower(root.get("businessNumber")), keyword),
                        builder.like(builder.lower(root.get("contactName")), keyword)
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
