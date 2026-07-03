import type { Dispatch, FormEvent, SetStateAction } from "react";

import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { TimeField } from "../../../shared/ui/TimeField";
import type { AttendanceSettings } from "../api/dto";

type AttendanceSettingsPanelProps = {
  form: AttendanceSettings;
  setForm: Dispatch<SetStateAction<AttendanceSettings>>;
  formReady: boolean;
  updatePending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AttendanceSettingsPanel({ form, setForm, formReady, updatePending, onSubmit }: AttendanceSettingsPanelProps) {
  return (
    <Panel title="출퇴근 기준 시간" description="근태 상태 계산에 사용할 출근, 퇴근, 지각 기준 시간을 설정합니다.">
      <form className="grid items-end gap-4 md:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={onSubmit}>
        <TimeField label="출근 기준" value={form.standardCheckInAt} onChange={(standardCheckInAt) => setForm((current) => ({ ...current, standardCheckInAt }))} required />
        <TimeField label="퇴근 기준" value={form.standardCheckOutAt} onChange={(standardCheckOutAt) => setForm((current) => ({ ...current, standardCheckOutAt }))} required />
        <TimeField label="지각 기준" value={form.lateAfterAt} onChange={(lateAfterAt) => setForm((current) => ({ ...current, lateAfterAt }))} required />
        <Button className="h-11" disabled={!formReady || updatePending}>{updatePending ? "저장 중" : "기준 저장"}</Button>
      </form>
    </Panel>
  );
}
