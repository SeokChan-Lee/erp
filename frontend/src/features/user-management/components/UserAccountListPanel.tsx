import { PencilLine, Search, UsersRound } from "lucide-react";

import { formatAccountDisplayName, formatRoleList } from "../../../shared/config/domainLabels";
import { Button } from "../../../shared/ui/Button";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { UserAccount, UserAccountRoleFilter, UserAccountStatusFilter } from "../api/dto";

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type UserAccountListPanelProps = {
  accounts: UserAccount[];
  totalAccounts: number;
  page: number;
  pageSize: number;
  searchInput: string;
  status: UserAccountStatusFilter;
  role: UserAccountRoleFilter;
  statusOptions: Array<SelectOption<UserAccountStatusFilter>>;
  roleOptions: Array<SelectOption<UserAccountRoleFilter>>;
  loading: boolean;
  canUpdate: boolean;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStatusChange: (status: UserAccountStatusFilter) => void;
  onRoleChange: (role: UserAccountRoleFilter) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onEdit: (account: UserAccount) => void;
};

export function UserAccountListPanel({
  accounts,
  totalAccounts,
  page,
  pageSize,
  searchInput,
  status,
  role,
  statusOptions,
  roleOptions,
  loading,
  canUpdate,
  onSearchInputChange,
  onApplySearch,
  onStatusChange,
  onRoleChange,
  onResetFilters,
  onPageChange,
  onEdit
}: UserAccountListPanelProps) {
  return (
    <Panel title="등록된 사용자 역할 관리" description="등록된 사용자와 역할을 보여줍니다.">
      {loading ? (
        <p className="text-sm font-semibold text-axis-muted">사용자 현황을 불러오는 중입니다.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid items-end gap-3 lg:grid-cols-[1.5fr_0.8fr_0.9fr_auto]">
            <TextField label="검색" placeholder="이름, 아이디, 부서, 역할" value={searchInput} leftIcon={<Search size={17} strokeWidth={2.2} />} onChange={(event) => onSearchInputChange(event.target.value)} onEnter={onApplySearch} />
            <SelectField label="계정 상태" value={status} options={statusOptions} onChange={onStatusChange} />
            <SelectField label="역할" value={role} options={roleOptions} onChange={onRoleChange} />
            <ResetButton onClick={onResetFilters} />
          </div>

          <TableFrame>
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">사용자</th>
                  <th className="px-4 py-3">소속</th>
                  <th className="px-4 py-3">현재 역할</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {accounts.map((account) => (
                  <tr key={account.id} className={account.active ? "" : "bg-axis-bg/60"}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-axis-ink text-white">
                          <UsersRound size={18} strokeWidth={2.2} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-axis-ink">{formatAccountDisplayName(account)}</p>
                          <p className="mt-1 text-xs font-medium text-axis-muted">{account.employee?.positionTitle ?? "직원 정보 없음"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{account.employee?.departmentName ?? "미연결"}</td>
                    <td className="px-4 py-4 text-sm font-medium text-axis-muted">{formatRoleList(account.roles)}</td>
                    <td className="px-4 py-4">
                      <span className={["inline-flex h-7 items-center rounded-full px-2.5 text-xs font-bold", account.active ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"].join(" ")}>
                        {account.active ? "사용 가능" : "비활성"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Button className="h-9 gap-2 px-3 text-xs" disabled={!canUpdate} type="button" variant="secondary" onClick={() => onEdit(account)}>
                        <PencilLine size={15} strokeWidth={2.2} />
                        수정
                      </Button>
                    </td>
                  </tr>
                ))}
                {accounts.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={5}>조건에 맞는 사용자 계정이 없습니다.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            <Pagination page={page} pageSize={pageSize} totalItems={totalAccounts} onPageChange={onPageChange} />
          </TableFrame>
        </div>
      )}
    </Panel>
  );
}
