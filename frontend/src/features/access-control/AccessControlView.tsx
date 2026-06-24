import { useEffect, useMemo, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";

import { useRolePermissionsQuery, useUpdateRolePermissionsMutation } from "./api/accessControlApi";
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

export function AccessControlView({ permissions = [] }: { permissions?: string[] }) {
  const { data: roles = [], error, isLoading } = useRolePermissionsQuery();
  const updateRolePermissions = useUpdateRolePermissionsMutation();
  const [selectedRole, setSelectedRole] = useState<RoleCode | null>(null);
  const [draftPermissions, setDraftPermissions] = useState<PermissionCode[]>([]);
  const canUpdateRoles = permissions.includes("ROLE_UPDATE");

  const role = roles.find((item) => item.role === selectedRole) ?? roles[0] ?? null;
  const isSuperAdmin = role?.role === "SUPER_ADMIN";
  const editable = Boolean(role && canUpdateRoles && !isSuperAdmin);
  const permissionGroups = useMemo<PermissionGroupSection[]>(
    () =>
      Object.keys(permissionGroupMeta).map((group) => ({
        group: group as PermissionGroup,
        permissions: Object.keys(permissionMeta).filter((permission) => getPermissionMeta(permission).group === group)
      })),
    []
  );

  useEffect(() => {
    if (!role) return;
    setSelectedRole(role.role);
    setDraftPermissions(role.permissions);
  }, [role?.role, role?.permissions]);

  const selectedCount = draftPermissions.length;

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

  return (
    <div className="space-y-6">
      {error || updateRolePermissions.error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error || updateRolePermissions.error)}
        </p>
      ) : null}

      <Panel title="역할 목록" description="역할별 권한은 백엔드 저장값을 기준으로 표시합니다.">
        {isLoading ? (
          <p className="text-sm font-semibold text-axis-muted">역할 권한을 불러오는 중입니다.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roles.map((item) => {
              const meta = getRoleMeta(item.role);
              const active = role?.role === item.role;

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
                  <p className={active ? "text-sm font-semibold text-white/65" : "text-sm font-semibold text-axis-blue"}>{meta.scope}</p>
                  <h3 className="mt-2 text-lg font-semibold">{meta.label}</h3>
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
          <div className="mb-5 flex flex-col justify-between gap-3 rounded-lg border border-axis-border bg-axis-bg px-4 py-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-axis-ink">
                <ShieldCheck size={18} strokeWidth={2.2} />
              </span>
              <div>
                <p className="text-sm font-bold text-axis-ink">{role.role}</p>
                <p className="mt-1 text-sm font-medium text-axis-muted">선택된 권한 {selectedCount}개</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="h-10 gap-2"
                disabled={!editable || updateRolePermissions.isPending || selectedCount === 0}
                onClick={handleSave}
              >
                <Save size={16} strokeWidth={2.2} />
                {updateRolePermissions.isPending ? "저장 중" : "저장"}
              </Button>
              <Button className="h-10" type="button" variant="secondary" onClick={() => setDraftPermissions(role.permissions)}>
                되돌리기
              </Button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {permissionGroups.map(({ group, permissions: groupPermissions }) => {
              const groupMeta = permissionGroupMeta[group];

              return (
                <section key={group} className="rounded-lg border border-axis-border bg-white p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-axis-ink">{groupMeta.label}</h3>
                    <p className="mt-1 text-sm leading-6 text-axis-muted">{groupMeta.description}</p>
                  </div>
                  <div className="grid gap-2">
                    {groupPermissions.map((permission) => {
                      const meta = getPermissionMeta(permission);
                      const checked = draftPermissions.includes(permission);

                      return (
                        <label
                          key={permission}
                          className={[
                            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition",
                            checked ? "border-axis-ink bg-axis-bg" : "border-axis-border bg-white hover:border-axis-border-strong",
                            editable ? "" : "cursor-not-allowed opacity-75"
                          ].join(" ")}
                        >
                          <input
                            checked={checked}
                            className="mt-1 h-4 w-4 accent-axis-ink"
                            disabled={!editable}
                            type="checkbox"
                            onChange={() => togglePermission(permission)}
                          />
                          <span>
                            <span className="block text-sm font-bold text-axis-ink">{meta.label}</span>
                            <span className="mt-1 block text-xs font-medium leading-5 text-axis-muted">{meta.description}</span>
                          </span>
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
