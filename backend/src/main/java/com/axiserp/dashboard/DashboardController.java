package com.axiserp.dashboard;

import com.axiserp.auth.AuthService;
import com.axiserp.auth.api.AuthUserResponse;
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
import java.util.Set;
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
        AuthUserResponse user = authService.requirePermission(sessionId, Permission.DASHBOARD_VIEW);
        Set<Permission> permissions = user.permissions();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime tomorrowStart = todayStart.plusDays(1);
        boolean canReadInventory = permissions.contains(Permission.INVENTORY_READ);
        boolean canReadPurchase = permissions.contains(Permission.PURCHASE_READ);
        boolean canReadSales = permissions.contains(Permission.SALES_READ);
        long pendingPurchaseRequests = permissions.contains(Permission.PURCHASE_APPROVE)
                ? purchaseRequestRepository.countByStatus(PurchaseRequestStatus.REQUESTED)
                : 0;
        long pendingAttendanceApprovals = permissions.contains(Permission.ATTENDANCE_APPROVE)
                ? attendanceChangeRequestRepository.countByStatus(AttendanceChangeRequestStatus.PENDING)
                : 0;
        long pendingPurchaseReceipts = canReadPurchase ? purchaseOrderRepository.countByReceivedAtIsNull() : 0;
        long registeredSalesOrders = canReadSales ? salesOrderRepository.countByStatus(SalesOrderStatus.REGISTERED) : 0;
        long pendingSalesShipments = canReadSales
                ? salesOrderRepository.countByStatusAndShippedAtIsNull(SalesOrderStatus.REGISTERED)
                : 0;
        long lowStockItems = canReadInventory
                ? inventoryStockRepository.findAll().stream()
                        .filter((stock) -> stock.getQuantity() < stock.getItem().getSafetyStock())
                        .count()
                : 0;
        long recentActivities = 0;
        if (canReadInventory) {
            recentActivities += inventoryMovementRepository.countByProcessedAtBetween(todayStart, tomorrowStart);
        }
        if (canReadPurchase) {
            recentActivities += purchaseOrderRepository.countByOrderedAtBetween(todayStart, tomorrowStart);
        }
        if (canReadSales) {
            recentActivities += salesOrderRepository.countByOrderedAtBetween(todayStart, tomorrowStart);
        }
        long checkedIn = permissions.contains(Permission.ATTENDANCE_READ_ALL)
                ? attendanceService.todayAll().size()
                : (permissions.contains(Permission.ATTENDANCE_READ_SELF)
                        && attendanceService.todayFor(user.username()).checkInAt() != null ? 1 : 0);

        return new DashboardSummaryResponse(
                checkedIn,
                pendingAttendanceApprovals + pendingPurchaseRequests,
                lowStockItems,
                recentActivities,
                pendingPurchaseRequests,
                pendingPurchaseReceipts,
                registeredSalesOrders,
                pendingSalesShipments,
                recentActivityItems(permissions)
        );
    }

    private List<DashboardRecentActivityResponse> recentActivityItems(Set<Permission> permissions) {
        Stream<DashboardRecentActivityResponse> activities = Stream.empty();
        if (permissions.contains(Permission.INVENTORY_READ)) {
            activities = Stream.concat(activities, inventoryMovementRepository.findTop5ByOrderByProcessedAtDescIdDesc().stream().map(this::inventoryActivity));
        }
        if (permissions.contains(Permission.PURCHASE_READ)) {
            activities = Stream.concat(activities, purchaseOrderRepository.findTop5ByOrderByOrderedAtDescIdDesc().stream().map(this::purchaseActivity));
        }
        if (permissions.contains(Permission.SALES_READ)) {
            activities = Stream.concat(activities, salesOrderRepository.findTop5ByOrderByOrderedAtDescIdDesc().stream().map(this::salesActivity));
        }
        return activities
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
