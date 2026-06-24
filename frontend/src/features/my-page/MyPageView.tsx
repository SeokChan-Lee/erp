import { useMeQuery } from "../auth/api/authApi";
import { Panel } from "../../shared/ui/Panel";
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

      <Panel title="내 권한" description="권한 코드를 업무 그룹 기준으로 정리했습니다.">
        <div className="space-y-4">
          {permissionGroups.map(({ group, permissions }) => (
            <section key={group} className="rounded-lg border border-axis-border bg-axis-bg p-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <div>
                  <h3 className="text-base font-bold text-axis-ink">{permissionGroupMeta[group].label}</h3>
                  <p className="mt-1 text-sm text-axis-muted">{permissionGroupMeta[group].description}</p>
                </div>
                <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#424245]">{permissions.length}개 권한</span>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {permissions.map((permission) => {
                  const meta = getPermissionMeta(permission);
                  return (
                    <div key={permission} className="rounded-lg bg-white px-3 py-3">
                      <p className="text-sm font-bold text-axis-ink">{meta.label}</p>
                      <p className="mt-1 text-xs leading-5 text-axis-muted">{meta.description}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
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
