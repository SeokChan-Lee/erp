package com.axiserp.dashboard.api;

public record DashboardSummaryResponse(
        long checkedIn,
        long pendingApprovals,
        long lowStockItems,
        long recentActivities,
        long pendingPurchaseRequests,
        long pendingPurchaseReceipts,
        long registeredSalesOrders,
        long pendingSalesShipments
) {
}
