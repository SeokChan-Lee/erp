package com.axiserp.dashboard;

import com.axiserp.auth.AuthService;
import com.axiserp.attendance.AttendanceChangeRequestRepository;
import com.axiserp.attendance.AttendanceChangeRequestStatus;
import com.axiserp.attendance.AttendanceService;
import com.axiserp.dashboard.api.DashboardSummaryResponse;
import com.axiserp.inventory.InventoryMovementRepository;
import com.axiserp.inventory.InventoryStockRepository;
import com.axiserp.permission.Permission;
import com.axiserp.purchase.PurchaseOrderRepository;
import com.axiserp.purchase.PurchaseRequestRepository;
import com.axiserp.purchase.PurchaseRequestStatus;
import com.axiserp.sales.SalesOrderRepository;
import com.axiserp.sales.SalesOrderStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
                pendingSalesShipments
        );
    }
}
