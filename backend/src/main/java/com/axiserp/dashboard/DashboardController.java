package com.axiserp.dashboard;

import com.axiserp.auth.AuthService;
import com.axiserp.attendance.AttendanceChangeRequestRepository;
import com.axiserp.attendance.AttendanceChangeRequestStatus;
import com.axiserp.attendance.AttendanceService;
import com.axiserp.dashboard.api.DashboardRecentActivityResponse;
import com.axiserp.dashboard.api.DashboardSummaryResponse;
import com.axiserp.inventory.InventoryMovementEntity;
import com.axiserp.inventory.InventoryMovementRepository;
import com.axiserp.inventory.InventoryStockRepository;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.PurchaseOrderEntity;
import com.axiserp.purchase.PurchaseOrderRepository;
import com.axiserp.purchase.PurchaseRequestRepository;
import com.axiserp.purchase.PurchaseRequestStatus;
import com.axiserp.sales.SalesOrderEntity;
import com.axiserp.sales.SalesOrderRepository;
import com.axiserp.sales.SalesOrderStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AuthService authService;
    private final AttendanceService attendanceService;
    private final AttendanceChangeRequestRepository attendanceChangeRequestRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryMovementRepository inventoryMovementRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SalesOrderRepository salesOrderRepository;

    public DashboardController(
            AuthService authService,
            AttendanceService attendanceService,
            AttendanceChangeRequestRepository attendanceChangeRequestRepository,
            InventoryStockRepository inventoryStockRepository,
            InventoryMovementRepository inventoryMovementRepository,
            PurchaseRequestRepository purchaseRequestRepository,
            PurchaseOrderRepository purchaseOrderRepository,
            SalesOrderRepository salesOrderRepository
    ) {
        this.authService = authService;
        this.attendanceService = attendanceService;
        this.attendanceChangeRequestRepository = attendanceChangeRequestRepository;
        this.inventoryStockRepository = inventoryStockRepository;
        this.inventoryMovementRepository = inventoryMovementRepository;
        this.purchaseRequestRepository = purchaseRequestRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.salesOrderRepository = salesOrderRepository;
    }

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        authService.requirePermission(sessionId, Permission.DASHBOARD_VIEW);
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        long pendingPurchaseRequests = purchaseRequestRepository.countByStatus(PurchaseRequestStatus.REQUESTED);
        long pendingPurchaseReceipts = purchaseOrderRepository.countByReceivedAtIsNull();
        long registeredSalesOrders = salesOrderRepository.countByStatus(SalesOrderStatus.REGISTERED);
        long pendingSalesShipments = salesOrderRepository.countByStatusAndShippedAtIsNull(SalesOrderStatus.REGISTERED);
        long pendingApprovals = attendanceChangeRequestRepository.countByStatus(AttendanceChangeRequestStatus.PENDING) + pendingPurchaseRequests;
        long lowStockItems = inventoryStockRepository.findAll().stream()
                .filter((stock) -> stock.getQuantity() < stock.getItem().getSafetyStock())
                .count();
        long recentActivities =
                inventoryMovementRepository.countByProcessedAtBetween(todayStart, tomorrowStart) +
                purchaseOrderRepository.countByOrderedAtBetween(todayStart, tomorrowStart) +
                salesOrderRepository.countByOrderedAtBetween(todayStart, tomorrowStart);

        return new DashboardSummaryResponse(
                attendanceService.todayAll().size(),
                pendingApprovals,
                lowStockItems,
                recentActivities,
                pendingPurchaseRequests,
                pendingPurchaseReceipts,
                registeredSalesOrders,
                pendingSalesShipments,
                recentActivityItems()
        );
    }

    private List<DashboardRecentActivityResponse> recentActivityItems() {
        return Stream.concat(
                        Stream.concat(
                                inventoryMovementRepository.findTop5ByOrderByProcessedAtDescIdDesc().stream().map(this::inventoryActivity),
                                purchaseOrderRepository.findTop5ByOrderByOrderedAtDescIdDesc().stream().map(this::purchaseActivity)
                        ),
                        salesOrderRepository.findTop5ByOrderByOrderedAtDescIdDesc().stream().map(this::salesActivity)
                )
                .sorted(Comparator.comparing(DashboardRecentActivityResponse::occurredAt).reversed())
                .limit(8)
                .toList();
    }

    private DashboardRecentActivityResponse inventoryActivity(InventoryMovementEntity movement) {
        return new DashboardRecentActivityResponse(
                "inventory-" + movement.getId(),
                "INVENTORY",
                movement.getQuantityDelta() > 0 ? "재고 증가" : "재고 감소",
                movement.getItem().getName() + " · " + movement.getWarehouse().getName(),
                movement.getReason(),
                movement.getProcessedAt(),
                movement.getProcessedBy()
        );
    }

    private DashboardRecentActivityResponse purchaseActivity(PurchaseOrderEntity order) {
        return new DashboardRecentActivityResponse(
                "purchase-" + order.getId(),
                "PURCHASE",
                order.isReceived() ? "구매 입고 완료" : "구매 발주 생성",
                order.getRequest().getSupplier().getName() + " · " + order.getRequest().getItem().getName(),
                order.getOrderNo(),
                order.isReceived() ? order.getReceivedAt() : order.getOrderedAt(),
                order.isReceived() ? order.getReceivedBy() : order.getOrderedBy()
        );
    }

    private DashboardRecentActivityResponse salesActivity(SalesOrderEntity order) {
        return new DashboardRecentActivityResponse(
                "sales-" + order.getId(),
                "SALES",
                order.isShipped() ? "판매 출고 완료" : "판매 수주 등록",
                order.getCustomer().getName() + " · " + order.getItem().getName(),
                order.getOrderNo(),
                order.isShipped() ? order.getShippedAt() : order.getOrderedAt(),
                order.isShipped() ? order.getShippedBy() : order.getOrderedBy()
        );
    }
}
