import { PencilLine, Search } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { ResetButton } from "../../../shared/ui/ResetButton";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { Item, ItemStatusFilter } from "../api/dto";
import { ItemStatusBadge } from "./inventoryDisplay";

type ItemListPanelProps = {
  items: Item[];
  totalItems: number;
  page: number;
  pageSize: number;
  searchInput: string;
  status: ItemStatusFilter;
  statusOptions: Array<{ value: ItemStatusFilter; label: string }>;
  loading: boolean;
  canUpdate: boolean;
  onSearchInputChange: (value: string) => void;
  onApplySearch: () => void;
  onStatusChange: (status: ItemStatusFilter) => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onEdit: (item: Item) => void;
};

export function ItemListPanel({
  items,
  totalItems,
  page,
  pageSize,
  searchInput,
  status,
  statusOptions,
  loading,
  canUpdate,
  onSearchInputChange,
  onApplySearch,
  onStatusChange,
  onResetFilters,
  onPageChange,
  onEdit
}: ItemListPanelProps) {
  return (
    <Panel title="품목 목록" description="ERP에서 사용하는 품목 기준과 사용 상태를 관리합니다.">
      <div className="mb-4 grid items-end gap-3 md:grid-cols-[1fr_220px_auto]">
        <TextField
          label="검색"
          placeholder="품목 코드, 품목명, 분류"
          value={searchInput}
          leftIcon={<Search size={17} strokeWidth={2.2} />}
          onChange={(event) => onSearchInputChange(event.target.value)}
          onEnter={onApplySearch}
        />
        <SelectField label="상태" value={status} options={statusOptions} onChange={onStatusChange} />
        <ResetButton onClick={onResetFilters} />
      </div>

      {loading ? (
        <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">품목 목록을 불러오는 중입니다.</p>
      ) : (
        <TableFrame>
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="px-4 py-3">품목</th>
                <th className="px-4 py-3">분류</th>
                <th className="px-4 py-3">단위</th>
                <th className="px-4 py-3">안전재고</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {items.map((item) => (
                <tr key={item.id} className={item.active ? "" : "bg-axis-bg/60"}>
                  <td className="px-4 py-4">
                    <p className="text-sm font-bold text-axis-ink">{item.name}</p>
                    <p className="mt-1 text-xs font-semibold text-axis-muted">{item.sku}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-muted">{item.category}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{item.unit}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-axis-ink">{item.safetyStock.toLocaleString("ko-KR")}</td>
                  <td className="px-4 py-4"><ItemStatusBadge active={item.active} /></td>
                  <td className="px-4 py-4">
                    {canUpdate ? (
                      <Button className="h-8 gap-1.5 px-3 text-xs" type="button" variant="secondary" onClick={() => onEdit(item)}>
                        <PencilLine size={14} strokeWidth={2.2} />
                        수정
                      </Button>
                    ) : (
                      <span className="text-xs font-semibold text-axis-muted">조회 전용</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm font-semibold text-axis-muted" colSpan={6}>조건에 맞는 품목이 없습니다.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={onPageChange} />
        </TableFrame>
      )}
    </Panel>
  );
}
