package com.axiserp.dashboard.api;

import java.util.List;

public record DashboardSummaryResponse(
        long checkedIn,
        long pendingApprovals,
        long lowStockItems,
        long recentActivities,
        long pendingPurchaseRequests,
        long pendingPurchaseReceipts,
        long registeredSalesOrders,
        long pendingSalesShipments,
        List<DashboardRecentActivityResponse> recentActivityItems
) {
}
