import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Building2, Mail, Plus, UsersRound } from "lucide-react";

import { employeeStatusMeta } from "../../../shared/config/domainLabels";
import { getErrorMessage } from "../../../shared/api/http";
import { Button } from "../../../shared/ui/Button";
import { MetricCard } from "../../../shared/ui/MetricCard";
import { Pagination } from "../../../shared/ui/Pagination";
import { Panel } from "../../../shared/ui/Panel";
import { SelectField } from "../../../shared/ui/SelectField";
import { TableFrame } from "../../../shared/ui/TableFrame";
import { TextField } from "../../../shared/ui/TextField";
import type { Department, DepartmentCreatePayload, Employee, EmployeeCreatePayload, EmployeeStatus } from "../api/dto";
import type { EmployeeEditForm } from "../types";

type Option<T extends string | number> = {
  value: T;
  label: string;
};

export function OrganizationSummaryCards({
  employeeCount,
  activeEmployees,
  departmentCount,
  operationCount,
  managementCount
}: {
  employeeCount: number;
  activeEmployees: number;
  departmentCount: number;
  operationCount: number;
  managementCount: number;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="전체 직원" value={`${employeeCount}명`} />
      <MetricCard label="재직 인원" value={`${activeEmployees}명`} change="근무 가능" />
      <MetricCard label="부서" value={`${departmentCount}개`} />
      <MetricCard label="운영 배치" value={`${operationCount}명`} change={`관리 ${managementCount}명`} />
    </div>
  );
}

export function DepartmentCreatePanel({
  form,
  setForm,
  formReady,
  createPending,
  onSubmit
}: {
  form: DepartmentCreatePayload;
  setForm: Dispatch<SetStateAction<DepartmentCreatePayload>>;
  formReady: boolean;
  createPending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel title="부서 등록" description="새 부서를 추가합니다.">
      <form className="grid items-end gap-4 xl:grid-cols-[180px_1fr_1.5fr_auto]" onSubmit={onSubmit}>
        <TextField label="부서 코드" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="예: DEV" required />
        <TextField label="부서명" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="예: 개발팀" required />
        <TextField label="설명" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="부서 역할을 입력해 주세요" />
        <Button className="h-11 gap-2" disabled={!formReady || createPending}>
          <Plus size={17} strokeWidth={2.2} />
          {createPending ? "등록 중" : "등록"}
        </Button>
      </form>
    </Panel>
  );
}

export function EmployeeCreatePanel({
  form,
  setForm,
  selectedDepartmentId,
  departmentOptions,
  statusOptions,
  departmentCount,
  formReady,
  createPending,
  error,
  onSubmit
}: {
  form: EmployeeCreatePayload;
  setForm: Dispatch<SetStateAction<EmployeeCreatePayload>>;
  selectedDepartmentId: number;
  departmentOptions: Array<Option<number>>;
  statusOptions: Array<Option<EmployeeStatus>>;
  departmentCount: number;
  formReady: boolean;
  createPending: boolean;
  error: unknown;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel title="직원 등록" description="새 직원을 추가합니다.">
      <form className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={onSubmit}>
        <TextField label="직원 번호" value={form.employeeNo} onChange={(event) => setForm((value) => ({ ...value, employeeNo: event.target.value }))} placeholder="E-0002" required />
        <TextField label="이름" value={form.displayName} onChange={(event) => setForm((value) => ({ ...value, displayName: event.target.value }))} placeholder="홍길동" required />
        <TextField label="이메일" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} placeholder="member@axis.local" type="email" required />
        <TextField label="직책" value={form.positionTitle} onChange={(event) => setForm((value) => ({ ...value, positionTitle: event.target.value }))} placeholder="운영 담당자" required />
        <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto] xl:col-span-5">
          <SelectField label="부서" value={selectedDepartmentId} options={departmentOptions} placeholder="부서 선택" disabled={departmentCount === 0} onChange={(departmentId) => setForm((value) => ({ ...value, departmentId }))} />
          <SelectField label="상태" value={form.status} options={statusOptions} onChange={(status) => setForm((value) => ({ ...value, status }))} />
          <Button className="h-11 gap-2" disabled={!formReady || createPending}>
            <Plus size={17} strokeWidth={2.2} />
            {createPending ? "등록 중" : "등록"}
          </Button>
        </div>
      </form>
      {error ? <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{getErrorMessage(error)}</p> : null}
    </Panel>
  );
}

export function DepartmentListPanel({ departments, employees }: { departments: Department[]; employees: Employee[] }) {
  return (
    <Panel title="부서 현황" description="현재 등록된 부서를 보여줍니다.">
      <div className="grid gap-4 md:grid-cols-2">
        {departments.map((department) => {
          const memberCount = employees.filter((employee) => employee.department.id === department.id).length;

          return (
            <article key={department.id} className="rounded-lg border border-axis-border bg-axis-bg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-axis-blue">부서</p>
                  <h3 className="mt-2 text-lg font-semibold text-axis-ink">{department.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-axis-muted">{department.description}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-axis-ink">
                  <Building2 size={19} strokeWidth={2.2} />
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between rounded-lg bg-white px-3 py-2">
                <span className="text-sm font-medium text-axis-muted">소속 직원</span>
                <strong className="text-sm font-semibold text-axis-ink">{memberCount}명</strong>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

export function EmployeeEditPanel({
  form,
  setForm,
  departmentOptions,
  statusOptions,
  departmentCount,
  formReady,
  updatePending,
  onCancel,
  onSubmit
}: {
  form: EmployeeEditForm;
  setForm: Dispatch<SetStateAction<EmployeeEditForm | null>>;
  departmentOptions: Array<Option<number>>;
  statusOptions: Array<Option<EmployeeStatus>>;
  departmentCount: number;
  formReady: boolean;
  updatePending: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel title="직원 정보 수정" description="선택한 직원 정보를 수정합니다.">
      <form className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]" onSubmit={onSubmit}>
        <TextField label="이름" value={form.displayName} onChange={(event) => setForm((value) => (value ? { ...value, displayName: event.target.value } : value))} required />
        <TextField label="이메일" type="email" value={form.email} onChange={(event) => setForm((value) => (value ? { ...value, email: event.target.value } : value))} required />
        <TextField label="직책" value={form.positionTitle} onChange={(event) => setForm((value) => (value ? { ...value, positionTitle: event.target.value } : value))} required />
        <SelectField label="부서" value={form.departmentId} options={departmentOptions} disabled={departmentCount === 0} onChange={(departmentId) => setForm((value) => (value ? { ...value, departmentId } : value))} />
        <SelectField label="상태" value={form.status} options={statusOptions} onChange={(status) => setForm((value) => (value ? { ...value, status } : value))} />
        <div className="flex items-end gap-2">
          <Button className="h-11" disabled={!formReady || updatePending}>{updatePending ? "저장 중" : "저장"}</Button>
          <Button className="h-11" type="button" variant="secondary" onClick={onCancel}>취소</Button>
        </div>
      </form>
    </Panel>
  );
}

export function EmployeeListPanel({
  employees,
  totalEmployees,
  page,
  pageSize,
  canUpdate,
  updatePending,
  updateError,
  onPageChange,
  onEdit,
  onStatusChange
}: {
  employees: Employee[];
  totalEmployees: number;
  page: number;
  pageSize: number;
  canUpdate: boolean;
  updatePending: boolean;
  updateError: unknown;
  onPageChange: (page: number) => void;
  onEdit: (employee: Employee) => void;
  onStatusChange: (employee: Employee, status: EmployeeStatus) => void;
}) {
  return (
    <Panel title="직원 목록" description="등록된 직원을 보여줍니다.">
      {updateError ? <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{getErrorMessage(updateError)}</p> : null}
      <TableFrame>
        <table className="w-full min-w-[920px] border-collapse text-left">
          <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
            <tr>
              <th className="px-4 py-3">직원</th>
              <th className="px-4 py-3">부서</th>
              <th className="px-4 py-3">직책</th>
              <th className="px-4 py-3">이메일</th>
              <th className="px-4 py-3">상태</th>
              {canUpdate ? <th className="px-4 py-3">관리</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-axis-border bg-white">
            {employees.map((employee) => {
              const status = employeeStatusMeta[employee.status];
              return (
                <tr key={employee.id}>
                  <td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-axis-ink text-white"><UsersRound size={18} strokeWidth={2.2} /></span><div><p className="text-sm font-semibold text-axis-ink">{employee.displayName}</p><p className="mt-1 text-xs font-medium text-axis-muted">{employee.employeeNo}</p></div></div></td>
                  <td className="px-4 py-4"><p className="text-sm font-semibold text-axis-ink">{employee.department.name}</p></td>
                  <td className="px-4 py-4 text-sm font-medium text-axis-ink">{employee.positionTitle}</td>
                  <td className="px-4 py-4"><span className="inline-flex items-center gap-2 text-sm font-medium text-axis-muted"><Mail size={15} strokeWidth={2.2} />{employee.email}</span></td>
                  <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span></td>
                  {canUpdate ? (
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="h-8 rounded-md border border-axis-border bg-white px-2.5 text-xs font-bold text-axis-ink transition hover:border-axis-ink" type="button" onClick={() => onEdit(employee)}>수정</button>
                        {Object.entries(employeeStatusMeta).map(([nextStatus, meta]) => {
                          const typedStatus = nextStatus as EmployeeStatus;
                          const isCurrent = employee.status === typedStatus;
                          return (
                            <button key={nextStatus} className={["h-8 rounded-md border px-2.5 text-xs font-bold transition", isCurrent ? "border-axis-ink bg-axis-ink text-white" : "border-axis-border bg-white text-axis-muted hover:border-axis-ink hover:text-axis-ink"].join(" ")} disabled={isCurrent || updatePending} type="button" onClick={() => onStatusChange(employee, typedStatus)}>
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination page={page} pageSize={pageSize} totalItems={totalEmployees} onPageChange={onPageChange} />
      </TableFrame>
    </Panel>
  );
}
