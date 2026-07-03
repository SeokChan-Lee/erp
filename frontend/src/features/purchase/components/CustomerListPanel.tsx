import { PencilLine, Plus, Search } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { Customer, CustomerStatusFilter } from "../api/dto";
import { StatusBadge } from "./purchaseDisplay";

type CustomerListPanelProps = {
  customers: Customer[];
  totalCustomers: number;
  page: number;
  pageSize: number;
  searchInput: string;
  status: CustomerStatusFilter;
  statusOptions: Array<{ value: CustomerStatusFilter; label: string }>;
  loading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  onCreateClick: () => void;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStatusChange: (status: CustomerStatusFilter) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onEdit: (customer: Customer) => void;
};

export function CustomerListPanel({
  customers,
  totalCustomers,
  page,
  pageSize,
  searchInput,
  status,
  statusOptions,
  loading,
  canCreate,
  canUpdate,
  onCreateClick,
  onSearchInputChange,
  onApplySearch,
  onStatusChange,
  onResetFilters,
  onPageChange,
  onEdit
}: CustomerListPanelProps) {
  return (
    <Panel
      title="고객사 목록"
      description="판매 업무에서 사용할 고객 거래처 기준 정보를 관리합니다."
      action={
        canCreate ? (
          <Button className="gap-2" type="button" onClick={onCreateClick}>
            <Plus size={17} strokeWidth={2.2} />
            고객사 등록
          </Button>
        ) : null
      }
    >
      <div className="mb-4 grid min-w-0 items-end gap-3 lg:grid-cols-[1fr_220px_auto_auto]">
        <TextField
          label="검색"
          placeholder="코드, 고객사명, 사업자번호, 담당자"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <SelectField label="상태" value={status} options={statusOptions} onChange={onStatusChange} />
        <Button className="h-11" type="button" variant="secondary" onClick={onApplySearch}>
          검색 적용
        </Button>
        <ResetButton onClick={onResetFilters} />
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">고객사 목록을 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[1080px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="px-4 py-3">고객사</th>
                <th className="px-4 py-3">사업자등록번호</th>
                <th className="px-4 py-3">담당자</th>
                <th className="px-4 py-3">연락처</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {customers.map((customer) => (
                <tr key={customer.id} className={customer.active ? "" : "bg-axis-bg/60"}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{customer.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{customer.code} · {customer.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{customer.businessNumber}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{customer.contactName}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{customer.phone}</td>
                  <td className="px-4 py-4"><StatusBadge active={customer.active} /></td>
                  <td className="px-4 py-4">
                    {canUpdate ? (
                      <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onEdit(customer)}>
                        <PencilLine size={14} strokeWidth={2.2} />
                        수정
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-axis-muted">조회 전용</span>
                    )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={6}>조건에 맞는 고객사가 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalCustomers} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}
