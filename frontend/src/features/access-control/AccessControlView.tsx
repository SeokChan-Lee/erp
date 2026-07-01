import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  LockKeyhole,
  Package,
  PencilLine,
  Plus,
  ReceiptText,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Truck,
  UserCog,
  UserRound,
  Users,
  Warehouse
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  useRolePermissionsQuery,
  useUpdateRolePermissionsMutation
} from "./api/accessControlApi";
import type { PermissionCode, RoleCode } from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import { getPermissionMeta, getRoleMeta, permissionGroupMeta, permissionMeta } from "../../shared/config/accessControlMeta";
import type { PermissionGroup } from "../../shared/config/accessControlMeta";
import { Button } from "../../shared/ui/Button";
import { Panel } from "../../shared/ui/Panel";

type PermissionGroupSection = {
  group: PermissionGroup;
  permissions: PermissionCode[];
};

const roleIcons: Record<RoleCode, LucideIcon> = {
  SUPER_ADMIN: ShieldCheck,
  ADMIN: Settings,
  HR_MANAGER: Users,
  SALES_MANAGER: ReceiptText,
  PURCHASE_MANAGER: ShoppingCart,
  INVENTORY_MANAGER: Warehouse,
  APPROVER: FileCheck2,
  EMPLOYEE: UserRound,
  VIEWER: Eye
};

const permissionGroupIcons: Record<PermissionGroup, LucideIcon> = {
  dashboard: BarChart3,
  user: UserCog,
  role: ShieldCheck,
  employee: Users,
  attendance: Clock3,
  customer: Building2,
  supplier: Truck,
  item: Package,
  inventory: Warehouse,
  purchase: ShoppingCart,
  sales: ReceiptText,
  approval: FileCheck2,
  statistics: BarChart3
};

const permissionActionIcon = (permission: PermissionCode): LucideIcon => {
  if (permission.includes("READ") || permission.includes("VIEW")) return Eye;
  if (permission.includes("CREATE")) return Plus;
  if (permission.includes("SETTINGS")) return Settings;
  if (permission.includes("UPDATE") || permission.includes("ADJUST") || permission.includes("MOVE")) return PencilLine;
  if (permission.includes("DELETE")) return Trash2;
  if (permission.includes("APPROVE") || permission.includes("PROCESS")) return CheckCheck;
  if (permission.includes("CHECK_IN") || permission.includes("CHECK_OUT")) return CheckCircle2;
  return LockKeyhole;
};

const samePermissionSet = (left: PermissionCode[], right: PermissionCode[]) =>
  left.length === right.length && left.every((permission) => right.includes(permission));

export function AccessControlView({ permissions = [] }: { permissions?: string[] }) {
  const { data: roles = [], error, isLoading } = useRolePermissionsQuery();
  const updateRolePermissions = useUpdateRolePermissionsMutation();
  const [selectedRole, setSelectedRole] = useState<RoleCode | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<PermissionCode[]>([]);
  const [initialPermissionsByRole, setInitialPermissionsByRole] = useState<Partial<Record<RoleCode, PermissionCode[]>>>({});
  const canUpdateRoles = permissions.includes("ROLE_UPDATE");

  const role = roles.find((item) => item.role === selectedRole) ?? roles[0] ?? null;
  const isSuperAdmin = role?.role === "SUPER_ADMIN";
  const editable = Boolean(role && canUpdateRoles && !isSuperAdmin);
  const initialPermissions = role ? initialPermissionsByRole[role.role] ?? role.permissions : [];
  const permissionGroups = useMemo<PermissionGroupSection[]>(
    () =>
      Object.keys(permissionGroupMeta).map((group) => ({
        group: group as PermissionGroup,
        permissions: Object.keys(permissionMeta).filter((permission) => getPermissionMeta(permission).group === group)
      })),
    []
  );
  const pageError = error || updateRolePermissions.error;

  useEffect(() => {
    if (!role) return;
    setSelectedRole(role.role);
    setDraftPermissions(initialPermissionsByRole[role.role] ?? role.permissions);
  }, [role?.role]);

  const selectedCount = draftPermissions.length;
  const hasSavedPermissionChanges = role ? !samePermissionSet(draftPermissions, role.permissions) : false;
  const hasInitialPermissionChanges = role ? !samePermissionSet(draftPermissions, initialPermissions) : false;

  const togglePermission = (permission: PermissionCode) => {
    if (!editable) return;
    setDraftPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  };

  const handleSave = () => {
    if (!role || !editable) return;
    updateRolePermissions.mutate({
      role: role.role,
      payload: { permissions: draftPermissions }
    });
  };

  const handleSetInitialPermissions = () => {
    if (!role) return;
    setInitialPermissionsByRole((current) => ({
      ...current,
      [role.role]: draftPermissions
    }));
  };

  const handleResetToInitialPermissions = () => {
    if (!role) return;
    setDraftPermissions(initialPermissions);
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <Panel title="역할 목록" description="역할별 권한 설정 현황을 확인합니다.">
        {isLoading ? (
          <p className="text-sm font-semibold text-axis-muted">역할 권한을 불러오는 중입니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((item) => {
              const meta = getRoleMeta(item.role);
              const active = role?.role === item.role;
              const RoleIcon = roleIcons[item.role];

              return (
                <button
                  key={item.role}
                  className={[
                    "rounded-lg border p-4 text-left transition",
                    active ? "border-axis-ink bg-axis-ink text-white" : "border-axis-border bg-axis-bg text-axis-ink hover:border-axis-ink"
                  ].join(" ")}
                  type="button"
                  onClick={() => setSelectedRole(item.role)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={active ? "text-sm font-semibold text-white/65" : "text-sm font-semibold text-axis-blue"}>{meta.scope}</p>
                      <h3 className="mt-2 text-lg font-semibold">{meta.label}</h3>
                    </div>
                    <span className={active ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-white" : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-axis-ink"}>
                      <RoleIcon size={18} strokeWidth={2.2} />
                    </span>
                  </div>
                  <p className={active ? "mt-2 text-sm leading-6 text-white/70" : "mt-2 text-sm leading-6 text-axis-muted"}>{meta.description}</p>
                  <div className={active ? "mt-4 text-xs font-bold text-white/75" : "mt-4 text-xs font-bold text-[#424245]"}>
                    {item.role === "SUPER_ADMIN" ? "모든 권한 고정" : `${item.permissions.length}개 권한`}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Panel>

      {role ? (
        <Panel
          title={`${getRoleMeta(role.role).label} 권한 편집`}
          description={isSuperAdmin ? "최고 관리자는 모든 권한으로 고정되어 수정할 수 없습니다." : "업무 그룹별 권한을 선택한 뒤 저장합니다."}
        >
          <div className="mb-4 flex flex-col justify-between gap-3 rounded-lg border border-axis-border bg-axis-bg px-3 py-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-axis-ink">
                <ShieldCheck size={17} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-bold text-axis-ink">{getRoleMeta(role.role).label}</p>
                <p className="mt-0.5 text-xs font-medium text-axis-muted">선택된 권한 {selectedCount}개</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                className="h-9 gap-2"
                disabled={!editable || updateRolePermissions.isPending || selectedCount === 0 || !hasSavedPermissionChanges}
                onClick={handleSave}
              >
                <Save size={16} strokeWidth={2.2} />
                {updateRolePermissions.isPending ? "저장 중" : "저장"}
              </Button>
              <Button
                className="h-9 gap-2"
                disabled={!editable || selectedCount === 0 || !hasInitialPermissionChanges || updateRolePermissions.isPending}
                type="button"
                variant="secondary"
                onClick={handleSetInitialPermissions}
              >
                <CheckCircle2 size={15} strokeWidth={2.2} />
                초기값 지정
              </Button>
              <Button
                className="h-9 gap-2"
                disabled={!role || !hasInitialPermissionChanges || updateRolePermissions.isPending}
                type="button"
                variant="secondary"
                onClick={handleResetToInitialPermissions}
              >
                <RotateCcw size={15} strokeWidth={2.2} />
                초기값으로 되돌리기
              </Button>
            </div>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {permissionGroups.map(({ group, permissions: groupPermissions }) => {
              const groupMeta = permissionGroupMeta[group];
              const GroupIcon = permissionGroupIcons[group];

              return (
                <section key={group} className="rounded-lg border border-axis-border bg-white p-3">
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
                      <GroupIcon size={16} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-axis-ink">{groupMeta.label}</h3>
                      <p className="mt-0.5 truncate text-xs font-medium text-axis-muted">{groupMeta.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    {groupPermissions.map((permission) => {
                      const meta = getPermissionMeta(permission);
                      const checked = draftPermissions.includes(permission);
                      const PermissionIcon = permissionActionIcon(permission);

                      return (
                        <label
                          key={permission}
                          className={[
                            "flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition",
                            checked
                              ? "border-axis-ink bg-[#f0f6ff]"
                              : "border-axis-border bg-white hover:border-axis-border-strong",
                            editable ? "" : "cursor-not-allowed opacity-75"
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                              checked ? "bg-axis-blue text-white" : "bg-axis-bg text-axis-muted"
                            ].join(" ")}
                          >
                            <PermissionIcon size={14} strokeWidth={2.2} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-axis-ink">{meta.label}</span>
                            <span className="mt-0.5 block truncate text-xs font-medium text-axis-muted">{meta.description}</span>
                          </span>
                          <input
                            checked={checked}
                            className="h-4 w-4 shrink-0 accent-axis-ink"
                            disabled={!editable}
                            type="checkbox"
                            onChange={() => togglePermission(permission)}
                          />
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </Panel>
      ) : null}

    </div>
  );
}
