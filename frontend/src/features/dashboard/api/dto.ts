export type DashboardRecentActivity = {
  id: string;
  type: "INVENTORY" | "PURCHASE" | "SALES";
  label: string;
  description: string;
  referenceNo: string;
  occurredAt: string;
  processedBy: string;
};

export type DashboardSummary = {
  checkedIn: number;
  pendingApprovals: number;
  lowStockItems: number;
  recentActivities: number;
  pendingPurchaseRequests: number;
  pendingPurchaseReceipts: number;
  registeredSalesOrders: number;
  pendingSalesShipments: number;
  recentActivityItems: DashboardRecentActivity[];
};
