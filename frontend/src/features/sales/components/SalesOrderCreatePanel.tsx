import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Send } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { SearchableSelectField } from "../../../shared/ui/SearchableSelectField";
import { TextField } from "../../../shared/ui/TextField";
import type { SalesOrderForm } from "../types";

type SelectOption = {
  value: number;
  label: string;
};

type SalesOrderCreatePanelProps = {
  form: SalesOrderForm;
  setForm: Dispatch<SetStateAction<SalesOrderForm>>;
  selectedCustomerId: number;
  selectedItemId: number;
  customerOptions: SelectOption[];
  itemOptions: SelectOption[];
  formReady: boolean;
  createPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function SalesOrderCreatePanel({ form, setForm, selectedCustomerId, selectedItemId, customerOptions, itemOptions, formReady, createPending, onSubmit }: SalesOrderCreatePanelProps) {
  return (
    <Panel title="판매 수주 등록" description="고객사와 품목을 선택해 판매 수주를 등록합니다.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <SearchableSelectField label="고객사" value={selectedCustomerId} options={customerOptions} placeholder="고객사 선택" searchPlaceholder="고객사 코드 또는 이름 검색" disabled={customerOptions.length === 0} onChange={(customerId) => setForm((current) => ({ ...current, customerId }))} />
        <SearchableSelectField label="품목" value={selectedItemId} options={itemOptions} placeholder="품목 선택" searchPlaceholder="품목 코드 또는 이름 검색" disabled={itemOptions.length === 0} onChange={(itemId) => setForm((current) => ({ ...current, itemId }))} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="수량" min={1} type="number" placeholder="수량 입력" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} required />
          <TextField label="단가" min={1} type="number" placeholder="단가 입력" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} required />
        </div>
        <label className="block">
          <span className="text-sm font-semibold text-axis-ink">수주 메모</span>
          <textarea className="mt-2 min-h-28 w-full resize-none rounded-lg border border-axis-border bg-white px-3 py-3 text-sm font-semibold text-axis-ink outline-none transition focus:border-axis-muted" value={form.memo} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} placeholder="예: 7월 납품 예정" />
        </label>
        <Button className="h-11 w-full gap-2" disabled={!formReady || createPending}>
          <Send size={17} strokeWidth={2.2} />
          {createPending ? "등록 중" : "판매 수주 등록"}
        </Button>
      </form>
    </Panel>
  );
}
