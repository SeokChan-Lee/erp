import { useEffect } from "react";
import { Building2, Clock3, FileClock, Handshake, LayoutDashboard, PackageSearch, ReceiptText, ShieldCheck, UserCog, UserRound } from "lucide-react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";

import { AccountMenu } from "./components/AccountMenu";
import { AccessControlView } from "../features/access-control/AccessControlView";
import { AuditLogView } from "../features/audit/AuditLogView";
import { AttendanceView } from "../features/attendance/AttendanceView";
import { LoginView } from "../features/auth/LoginView";
import { useMeQuery } from "../features/auth/api/authApi";
import { DashboardView } from "../features/dashboard/DashboardView";
import { InventoryView } from "../features/inventory/InventoryView";
import { MyPageView } from "../features/my-page/MyPageView";
import { OrganizationView } from "../features/organization/OrganizationView";
import { PurchaseView } from "../features/purchase/PurchaseView";
import { SalesView } from "../features/sales/SalesView";
import { UserManagementView } from "../features/user-management/UserManagementView";
import { useAppStore } from "../shared/store/appStore";
import { ApiError, getErrorMessage } from "../shared/api/http";
import { AxisLogo } from "../shared/ui/AxisLogo";
import { Button } from "../shared/ui/Button";

const navItems = [
  { to: "/dashboard", label: "대시보드", description: "오늘의 운영 현황", icon: LayoutDashboard, permission: "DASHBOARD_VIEW" },
  { to: "/organization", label: "조직/직원", description: "부서와 직원 현황", icon: Building2, permission: "EMPLOYEE_READ" },
  { to: "/users", label: "사용자 관리", description: "직원 등록과 계정 설정", icon: UserCog, permission: "USER_READ" },
  { to: "/attendance", label: "출퇴근", description: "근태 체크 및 기록", icon: Clock3, permission: "ATTENDANCE_READ_SELF" },
  { to: "/inventory", label: "품목/재고", description: "품목 기준과 현재고", icon: PackageSearch, permission: "INVENTORY_READ" },
  { to: "/purchase", label: "구매/거래처", description: "고객사, 공급사, 구매 요청", icon: Handshake, permissions: ["CUSTOMER_READ", "SUPPLIER_READ", "PURCHASE_READ"] },
  { to: "/sales", label: "판매/수주", description: "판매 수주 관리", icon: ReceiptText, permission: "SALES_READ" },
  { to: "/audit", label: "운영 이력", description: "처리 로그와 감사 기록", icon: FileClock, permission: "APPROVAL_READ" },
  { to: "/access", label: "권한", description: "역할과 권한 관리", icon: ShieldCheck, permission: "ROLE_READ" },
  { to: "/my-page", label: "마이페이지", description: "내 계정 정보", icon: UserRound }
];

export function App() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const location = useLocation();
  const { data: user, error: authError, isFetching, isLoading, refetch } = useMeQuery();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axis-bg text-sm font-semibold text-axis-muted">
        Axis ERP를 불러오는 중입니다.
      </div>
    );
  }

  if (authError && !(authError instanceof ApiError && authError.status === 401)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axis-bg px-6">
        <div className="w-full max-w-md rounded-lg border border-axis-border bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-axis-ink">서비스에 연결할 수 없습니다.</h1>
          <p className="mt-2 text-sm font-medium text-axis-muted">{getErrorMessage(authError)}</p>
          <Button className="mt-5" disabled={isFetching} onClick={() => void refetch()}>
            {isFetching ? "다시 연결 중" : "다시 시도"}
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const title = pageTitle(location.pathname);
  const visibleNavItems = navItems.filter((item) => {
    const itemPermissions = "permissions" in item ? item.permissions : undefined;
    if (itemPermissions?.length) return itemPermissions.some((permission) => user.permissions.includes(permission));
    return !item.permission || user.permissions.includes(item.permission);
  });
  const canReadEmployees = user.permissions.includes("EMPLOYEE_READ");
  const canReadUsers = user.permissions.includes("USER_READ");
  const canReadRoles = user.permissions.includes("ROLE_READ");
  const canReadAttendance = user.permissions.includes("ATTENDANCE_READ_SELF");
  const canReadInventory = user.permissions.includes("INVENTORY_READ");
  const canReadPurchase = user.permissions.includes("CUSTOMER_READ") || user.permissions.includes("SUPPLIER_READ") || user.permissions.includes("PURCHASE_READ");
  const canReadSales = user.permissions.includes("SALES_READ");
  const canReadAudit = user.permissions.includes("APPROVAL_READ");

  return (
    <div className="min-h-screen bg-axis-bg text-axis-ink">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-20 border-r border-axis-border-strong bg-white transition-all",
          sidebarCollapsed ? "w-[84px]" : "w-[280px]"
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-axis-border-strong px-5">
          <div className={sidebarCollapsed ? "sr-only" : "flex items-center gap-3"}>
            <AxisLogo compact />
          </div>
          <Button variant="ghost" className="h-9 w-9 px-0" onClick={toggleSidebar} aria-label="사이드바 접기">
            {sidebarCollapsed ? ">" : "<"}
          </Button>
        </div>

        <nav className="space-y-2 p-3">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={[
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition",
                  location.pathname === item.to ? "bg-axis-ink text-white" : "text-axis-ink hover:bg-axis-bg"
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    location.pathname === item.to ? "bg-white text-axis-ink" : "bg-axis-bg text-axis-muted"
                  ].join(" ")}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className={sidebarCollapsed ? "sr-only" : "min-w-0"}>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={location.pathname === item.to ? "block text-xs text-white/70" : "block text-xs text-axis-muted"}>
                    {item.description}
                  </span>
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className={["min-h-screen transition-all", sidebarCollapsed ? "pl-[84px]" : "pl-[280px]"].join(" ")}>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-axis-border-strong bg-white px-8">
          <div>
            <p className="text-sm font-medium text-axis-muted">Axis ERP</p>
            <h1 className="text-xl font-semibold text-axis-ink">{title}</h1>
          </div>
          <AccountMenu user={user} />
        </header>

        <div className="mx-auto max-w-7xl px-8 pb-[420px] pt-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView permissions={user.permissions} />} />
            <Route path="/organization" element={canReadEmployees ? <OrganizationView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route
              path="/users"
              element={canReadUsers ? <UserManagementView currentUsername={user.username} permissions={user.permissions} /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/attendance" element={canReadAttendance ? <AttendanceView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/inventory" element={canReadInventory ? <InventoryView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/purchase" element={canReadPurchase ? <PurchaseView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/sales" element={canReadSales ? <SalesView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/audit" element={canReadAudit ? <AuditLogView /> : <Navigate to="/dashboard" replace />} />
            <Route path="/access" element={canReadRoles ? <AccessControlView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/my-page" element={<MyPageView />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === "/organization") return "조직/직원 관리";
  if (pathname === "/users") return "사용자 관리";
  if (pathname === "/attendance") return "출퇴근 관리";
  if (pathname === "/inventory") return "품목/재고 관리";
  if (pathname === "/purchase") return "구매/거래처 관리";
  if (pathname === "/sales") return "판매/수주 관리";
  if (pathname === "/audit") return "운영 이력";
  if (pathname === "/access") return "권한 관리";
  if (pathname === "/my-page") return "마이페이지";
  return "대시보드";
}
