package com.axiserp.inventory.api;

import com.axiserp.auth.AuthService;
import com.axiserp.common.api.PageResponse;
import com.axiserp.inventory.InventoryStockEntity;
import com.axiserp.inventory.InventoryStockRepository;
import com.axiserp.inventory.ItemEntity;
import com.axiserp.inventory.ItemRepository;
import com.axiserp.inventory.WarehouseEntity;
import com.axiserp.inventory.WarehouseRepository;
import com.axiserp.permission.Permission;
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
@RequestMapping("/api/items")
public class ItemController {

    private final AuthService authService;
    private final ItemRepository itemRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryStockRepository inventoryStockRepository;

    public ItemController(
            AuthService authService,
            ItemRepository itemRepository,
            WarehouseRepository warehouseRepository,
            InventoryStockRepository inventoryStockRepository
    ) {
        this.authService = authService;
        this.itemRepository = itemRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryStockRepository = inventoryStockRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<ItemResponse> items(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "ALL") String status
    ) {
        authService.requirePermission(sessionId, Permission.ITEM_READ);
        PageRequest pageRequest = PageRequest.of(normalizedPage(page), normalizedPageSize(pageSize), Sort.by("id").ascending());
        return PageResponse.from(itemRepository.findAll(itemSpecification(search, status), pageRequest), ItemResponse::from);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ItemResponse create(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @Valid @RequestBody ItemCreateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.ITEM_CREATE);
        String sku = request.sku().trim();
        if (itemRepository.existsBySku(sku)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 품목 코드입니다.");
        }

        ItemEntity item = itemRepository.save(new ItemEntity(
                sku,
                request.name().trim(),
                request.category().trim(),
                request.unit().trim(),
                request.safetyStock()
        ));
        for (WarehouseEntity warehouse : warehouseRepository.findAllByOrderByIdAsc()) {
            inventoryStockRepository.save(new InventoryStockEntity(item, warehouse, 0));
        }
        return ItemResponse.from(item);
    }

    @PatchMapping("/{id}")
    @Transactional
    public ItemResponse update(
            @CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId,
            @PathVariable Long id,
            @Valid @RequestBody ItemUpdateRequest request
    ) {
        authService.requirePermission(sessionId, Permission.ITEM_UPDATE);
        ItemEntity item = itemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "품목을 찾을 수 없습니다."));
        item.update(
                request.name().trim(),
                request.category().trim(),
                request.unit().trim(),
                request.safetyStock(),
                request.active()
        );
        return ItemResponse.from(item);
    }

    private Specification<ItemEntity> itemSpecification(String search, String status) {
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
                        builder.like(builder.lower(root.get("sku")), keyword),
                        builder.like(builder.lower(root.get("name")), keyword),
                        builder.like(builder.lower(root.get("category")), keyword)
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
