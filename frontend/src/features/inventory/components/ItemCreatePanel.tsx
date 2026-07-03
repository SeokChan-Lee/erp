import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Plus } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { TextField } from "../../../shared/ui/TextField";
import type { ItemCreateForm } from "../types";

type ItemCreatePanelProps = {
  form: ItemCreateForm;
  setForm: Dispatch<SetStateAction<ItemCreateForm>>;
  formReady: boolean;
  createPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ItemCreatePanel({ form, setForm, formReady, createPending, onSubmit }: ItemCreatePanelProps) {
  return (
    <Panel title="품목 등록" description="구매, 판매, 재고 처리에서 사용할 품목 기준 정보를 등록합니다.">
      <form className="grid items-end gap-4 xl:grid-cols-[1fr_1.3fr_1fr_0.7fr_0.8fr_auto]" onSubmit={onSubmit}>
        <TextField
          label="품목 코드"
          value={form.sku}
          onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
          placeholder="AX-ITM-004"
          required
        />
        <TextField
          label="품목명"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="무선 키보드"
          required
        />
        <TextField
          label="분류"
          value={form.category}
          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          placeholder="IT 장비"
          required
        />
        <TextField
          label="단위"
          value={form.unit}
          onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
          placeholder="개"
          required
        />
        <TextField
          label="안전재고"
          min={0}
          type="number"
          placeholder="안전재고 입력"
          value={form.safetyStock}
          onChange={(event) => setForm((current) => ({ ...current, safetyStock: event.target.value }))}
          required
        />
        <Button className="h-11 gap-2" disabled={!formReady || createPending}>
          <Plus size={17} strokeWidth={2.2} />
          {createPending ? "등록 중" : "등록"}
        </Button>
      </form>
    </Panel>
  );
}
