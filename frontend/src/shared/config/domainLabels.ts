import { getRoleMeta } from "./accessControlMeta";

export type EmployeeStatusCode = "ACTIVE" | "ON_LEAVE" | "RESIGNED";

export const employeeStatusMeta: Record<EmployeeStatusCode, { label: string; className: string }> = {
  ACTIVE: { label: "재직", className: "bg-emerald-50 text-emerald-700" },
  ON_LEAVE: { label: "휴직", className: "bg-amber-50 text-amber-700" },
  RESIGNED: { label: "퇴사", className: "bg-axis-bg text-axis-muted" }
};

export function getEmployeeStatusMeta(status: string) {
  return employeeStatusMeta[status as EmployeeStatusCode] ?? { label: "상태 미정", className: "bg-axis-bg text-axis-muted" };
}

export function formatAccountDisplayName(account: { displayName?: string | null }) {
  return account.displayName?.trim() || "사용자";
}

export function formatRoleList(roles: string[]) {
  return roles.map((role) => getRoleMeta(role).label).join(", ");
}
