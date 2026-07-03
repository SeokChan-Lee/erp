import type { Dispatch, FormEvent, SetStateAction } from "react";
import { KeyRound, Plus } from "lucide-react";

import type { RoleCode } from "../../../shared/config/accessControlMeta";
import { getRoleMeta } from "../../../shared/config/accessControlMeta";
import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextField } from "../../../shared/ui/TextField";
import type { UserAccountCreateForm } from "../types";

type SelectOption = {
  value: number;
  label: string;
};

type ExistingEmployeeAccountLinkPanelProps = {
  form: UserAccountCreateForm;
  setForm: Dispatch<SetStateAction<UserAccountCreateForm>>;
  selectedEmployeeId: number;
  employeeOptions: SelectOption[];
  roleOptions: RoleCode[];
  employeesLoading: boolean;
  employeeCount: number;
  formReady: boolean;
  createPending: boolean;
  onToggleRole: (role: RoleCode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ExistingEmployeeAccountLinkPanel({
  form,
  setForm,
  selectedEmployeeId,
  employeeOptions,
  roleOptions,
  employeesLoading,
  employeeCount,
  formReady,
  createPending,
  onToggleRole,
  onSubmit
}: ExistingEmployeeAccountLinkPanelProps) {
  return (
    <Panel title="기존 직원 계정 연결" description="기존 직원에 로그인 계정을 연결합니다.">
      <form onSubmit={onSubmit}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
            <KeyRound size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-axis-ink">기존 직원 계정 연결</h3>
            <p className="mt-1 text-xs font-medium text-axis-muted">계정이 없는 직원에게 로그인 정보를 추가합니다.</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <SelectField
            label="직원"
            value={selectedEmployeeId}
            options={employeeOptions}
            placeholder={employeesLoading ? "직원 불러오는 중" : "계정이 없는 직원 선택"}
            disabled={employeesLoading || employeeCount === 0}
            onChange={(employeeId) => setForm((current) => ({ ...current, employeeId }))}
          />
          <TextField label="로그인 ID" placeholder="예: hong.gildong" value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required />
          <TextField label="초기 비밀번호" placeholder="4자 이상" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required />
        </div>

        <div className="mt-4">
          <p className="text-sm font-semibold text-axis-ink">역할</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roleOptions.map((role) => {
              const checked = form.roles.includes(role);

              return (
                <button
                  key={role}
                  aria-pressed={checked}
                  className={[
                    "min-h-11 rounded-lg border px-3 text-left text-sm font-bold transition",
                    checked ? "border-axis-ink bg-axis-ink text-white" : "border-axis-border bg-white text-axis-ink hover:border-axis-border-strong"
                  ].join(" ")}
                  type="button"
                  onClick={() => onToggleRole(role)}
                >
                  {getRoleMeta(role).label}
                </button>
              );
            })}
          </div>
        </div>

        {employeeCount === 0 ? (
          <p className="mt-4 rounded-lg bg-axis-bg px-4 py-3 text-sm font-semibold text-axis-muted">계정을 연결할 수 있는 기존 직원이 없습니다.</p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <Button className="h-11 gap-2" disabled={!formReady || createPending || employeeCount === 0}>
            <Plus size={17} strokeWidth={2.2} />
            {createPending ? "연결 중" : "계정 연결"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
