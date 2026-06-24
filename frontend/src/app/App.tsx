import { BarChart3, Building2, Clock3, LayoutDashboard, ShieldCheck, UserCog, UserRound } from "lucide-react";
import { Navigate, NavLink, Route, Routes, useLocation } from "react-router-dom";

import { AccountMenu } from "./components/AccountMenu";
import { AccessControlView } from "../features/access-control/AccessControlView";
import { AttendanceView } from "../features/attendance/AttendanceView";
import { LoginView } from "../features/auth/LoginView";
import { useMeQuery } from "../features/auth/api/authApi";
import { DashboardView } from "../features/dashboard/DashboardView";
import { MyPageView } from "../features/my-page/MyPageView";
import { OrganizationView } from "../features/organization/OrganizationView";
import { UserManagementView } from "../features/user-management/UserManagementView";
import { useAppStore } from "../shared/store/appStore";
import { Button } from "../shared/ui/Button";

const navItems = [
  { to: "/dashboard", label: "대시보드", description: "오늘의 운영 현황", icon: LayoutDashboard, permission: "DASHBOARD_VIEW" },
  { to: "/organization", label: "조직/직원", description: "부서와 직원 현황", icon: Building2, permission: "EMPLOYEE_READ" },
  { to: "/users", label: "사용자 관리", description: "직원 등록과 계정 설정", icon: UserCog, permission: "USER_READ" },
  { to: "/attendance", label: "출퇴근", description: "근태 체크 및 기록", icon: Clock3, permission: "ATTENDANCE_READ_SELF" },
  { to: "/access", label: "권한", description: "역할과 권한 관리", icon: ShieldCheck, permission: "ROLE_READ" },
  { to: "/my-page", label: "마이페이지", description: "내 계정 정보", icon: UserRound }
];

export function App() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const location = useLocation();
  const { data: user, isLoading } = useMeQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-axis-bg text-sm font-semibold text-axis-muted">
        Axis ERP를 불러오는 중입니다.
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const title = pageTitle(location.pathname);
  const visibleNavItems = navItems.filter((item) => !item.permission || user.permissions.includes(item.permission));
  const canReadEmployees = user.permissions.includes("EMPLOYEE_READ");
  const canReadUsers = user.permissions.includes("USER_READ");
  const canReadRoles = user.permissions.includes("ROLE_READ");
  const canReadAttendance = user.permissions.includes("ATTENDANCE_READ_SELF");

  return (
    <div className="min-h-screen bg-axis-bg text-axis-ink">
      <aside
        className={[
          "fixed inset-y-0 left-0 z-20 border-r border-axis-border bg-white transition-all",
          sidebarCollapsed ? "w-[84px]" : "w-[280px]"
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-axis-border px-5">
          <div className={sidebarCollapsed ? "sr-only" : "flex items-center gap-3"}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-axis-ink text-white">
              <BarChart3 size={19} strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-normal">Axis ERP</p>
              <p className="text-xs font-medium text-axis-muted">운영 관리 센터</p>
            </div>
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-axis-border bg-axis-bg px-8">
          <div>
            <p className="text-sm font-medium text-axis-muted">Axis ERP</p>
            <h1 className="text-xl font-semibold text-axis-ink">{title}</h1>
          </div>
          <AccountMenu user={user} />
        </header>

        <div className="mx-auto max-w-7xl px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/organization" element={canReadEmployees ? <OrganizationView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
            <Route
              path="/users"
              element={canReadUsers ? <UserManagementView currentUsername={user.username} permissions={user.permissions} /> : <Navigate to="/dashboard" replace />}
            />
            <Route path="/attendance" element={canReadAttendance ? <AttendanceView permissions={user.permissions} /> : <Navigate to="/dashboard" replace />} />
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
  if (pathname === "/access") return "권한 관리";
  if (pathname === "/my-page") return "마이페이지";
  return "대시보드";
}
