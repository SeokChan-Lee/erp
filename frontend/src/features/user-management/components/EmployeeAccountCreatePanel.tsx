import type { Dispatch, FormEvent, SetStateAction } from "react";
import { KeyRound, Plus, UserRoundPlus } from "lucide-react";

import type { RoleCode } from "../../../shared/config/accessControlMeta";
import { getRoleMeta } from "../../../shared/config/accessControlMeta";
import { Button } from "../../../shared/ui/Button";
import { Panel } from "../../../shared/ui/Panel";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextField } from "../../../shared/ui/TextField";
import type { EmployeeAccountCreatePayload } from "../api/dto";

type SelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type EmployeeAccountCreatePanelProps = {
  form: EmployeeAccountCreatePayload;
  setForm: Dispatch<SetStateAction<EmployeeAccountCreatePayload>>;
  selectedDepartmentId: number;
  departmentOptions: Array<SelectOption<number>>;
  statusOptions: Array<SelectOption<EmployeeAccountCreatePayload["status"]>>;
  roleOptions: RoleCode[];
  departmentsLoading: boolean;
  departmentCount: number;
  formReady: boolean;
  createPending: boolean;
  onToggleRole: (role: RoleCode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EmployeeAccountCreatePanel({
  form,
  setForm,
  selectedDepartmentId,
  departmentOptions,
  statusOptions,
  roleOptions,
  departmentsLoading,
  departmentCount,
  formReady,
  createPending,
  onToggleRole,
  onSubmit
}: EmployeeAccountCreatePanelProps) {
  return (
    <Panel title="직원 및 계정 등록" description="새 직원과 계정을 함께 추가합니다.">
      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="border-b border-axis-border pb-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
              <UserRoundPlus size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-axis-ink">직원 정보</h3>
              <p className="mt-1 text-xs font-medium text-axis-muted">직원 기본 정보를 입력합니다.</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-4">
            <TextField label="직원 번호" placeholder="E-0002" value={form.employeeNo} onChange={(event) => setForm((current) => ({ ...current, employeeNo: event.target.value }))} required />
            <TextField label="이름" placeholder="홍길동" value={form.displayName} onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required />
            <TextField label="이메일" placeholder="member@axis.local" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
            <TextField label="직책" placeholder="운영 담당자" value={form.positionTitle} onChange={(event) => setForm((current) => ({ ...current, positionTitle: event.target.value }))} required />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <SelectField
              label="부서"
              value={selectedDepartmentId}
              options={departmentOptions}
              placeholder={departmentsLoading ? "부서 불러오는 중" : "부서 선택"}
              disabled={departmentsLoading || departmentCount === 0}
              onChange={(departmentId) => setForm((current) => ({ ...current, departmentId }))}
            />
            <SelectField label="상태" value={form.status} options={statusOptions} onChange={(status) => setForm((current) => ({ ...current, status }))} />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
              <KeyRound size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-axis-ink">로그인 설정</h3>
              <p className="mt-1 text-xs font-medium text-axis-muted">로그인 계정과 역할을 정합니다.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
        </section>

        <div className="flex justify-end">
          <Button className="h-11 gap-2" disabled={!formReady || createPending || departmentCount === 0}>
            <Plus size={17} strokeWidth={2.2} />
            {createPending ? "등록 중" : "직원 및 계정 등록"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
