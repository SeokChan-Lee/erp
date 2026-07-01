import { useMeQuery } from "../auth/api/authApi";
import { Panel } from "../../shared/ui/Panel";
import { getPermissionActionIcon, permissionGroupIcons } from "../../shared/config/accessControlIcons";
import { getPermissionMeta, getRoleMeta, groupPermissions, permissionGroupMeta } from "../../shared/config/accessControlMeta";
import { formatAccountDisplayName, formatRoleList } from "../../shared/config/domainLabels";

export function MyPageView() {
  const { data: user } = useMeQuery();
  const permissionGroups = groupPermissions(user?.permissions ?? []);

  return (
    <div className="space-y-6">
      <Panel title="마이페이지" description="현재 로그인한 계정의 기본 정보입니다.">
        <div className="grid gap-4 md:grid-cols-2">
          <InfoItem label="사용자" value={user ? formatAccountDisplayName(user) : "-"} />
          <InfoItem label="역할" value={user ? formatRoleList(user.roles) : "-"} />
          <InfoItem label="권한 수" value={`${user?.permissions.length ?? 0}개`} />
        </div>
      </Panel>

      <Panel title="내 역할" description="현재 계정에 부여된 역할과 업무 범위입니다.">
        <div className="grid gap-4 md:grid-cols-2">
          {(user?.roles ?? []).map((role) => {
            const meta = getRoleMeta(role);
            return (
              <article key={role} className="rounded-lg border border-axis-border bg-axis-bg p-4">
                <p className="text-sm font-semibold text-axis-blue">{meta.scope}</p>
                <h3 className="mt-2 text-lg font-semibold text-axis-ink">{meta.label}</h3>
                <p className="mt-2 text-sm leading-6 text-axis-muted">{meta.description}</p>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel title="내 권한" description="사용 가능한 권한입니다.">
        <div className="grid gap-3 xl:grid-cols-3">
          {permissionGroups.map(({ group, permissions }) => {
            const groupMeta = permissionGroupMeta[group];
            const GroupIcon = permissionGroupIcons[group];

            return (
              <section key={group} className="rounded-lg border border-axis-border bg-white p-3">
                <div className="mb-3 flex items-center justify-between gap-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
                      <GroupIcon size={16} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-axis-ink">{groupMeta.label}</h3>
                      <p className="mt-0.5 truncate text-xs font-medium text-axis-muted">{groupMeta.description}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-axis-bg px-2.5 py-1 text-xs font-bold text-axis-ink">
                    {permissions.length}개
                  </span>
                </div>
                <div className="grid gap-1.5">
                  {permissions.map((permission) => {
                    const meta = getPermissionMeta(permission);
                    const PermissionIcon = getPermissionActionIcon(permission);

                    return (
                      <div
                        key={permission}
                        className="flex items-center gap-2.5 rounded-lg border border-axis-ink bg-[#f0f6ff] px-2.5 py-2"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-axis-blue text-white">
                          <PermissionIcon size={14} strokeWidth={2.2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold text-axis-ink">{meta.label}</span>
                          <span className="mt-0.5 block truncate text-xs font-medium text-axis-muted">{meta.description}</span>
                        </span>
                        <input
                          aria-label={`${meta.label} 권한 보유`}
                          checked
                          className="h-4 w-4 shrink-0 accent-axis-ink"
                          readOnly
                          type="checkbox"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {permissionGroups.length === 0 ? (
            <section className="rounded-lg border border-axis-border bg-axis-bg p-4">
              <p className="text-sm font-semibold text-axis-muted">사용 가능한 권한이 없습니다.</p>
            </section>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
      <p className="text-xs font-semibold text-axis-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-axis-ink">{value}</p>
    </div>
  );
}
