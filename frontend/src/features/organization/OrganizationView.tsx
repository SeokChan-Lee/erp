import { FormEvent, useMemo, useState } from "react";
import { Building2, Mail, Plus, UsersRound } from "lucide-react";

import {
  useCreateDepartmentMutation,
  useCreateEmployeeMutation,
  useDepartmentsQuery,
  useEmployeesQuery,
  useUpdateEmployeeMutation
} from "./api/organizationApi";
import type { DepartmentCreatePayload, Employee, EmployeeCreatePayload, EmployeeStatus, EmployeeUpdatePayload } from "./api/dto";
import { Button } from "../../shared/ui/Button";
import { employeeStatusMeta } from "../../shared/config/domainLabels";
import { getErrorMessage } from "../../shared/api/http";
import { MetricCard } from "../../shared/ui/MetricCard";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";
import { TextField } from "../../shared/ui/TextField";

const PAGE_SIZE = 20;

const initialForm: EmployeeCreatePayload = {
  employeeNo: "",
  displayName: "",
  email: "",
  positionTitle: "",
  status: "ACTIVE",
  departmentId: 0
};

const initialDepartmentForm: DepartmentCreatePayload = {
  code: "",
  name: "",
  description: ""
};

type EmployeeEditForm = EmployeeUpdatePayload & {
  id: number;
};

export function OrganizationView({ permissions = [] }: { permissions?: string[] }) {
  const { data: departments = [], error: departmentError } = useDepartmentsQuery();
  const { data: employees = [], error: employeeError } = useEmployeesQuery();
  const createDepartment = useCreateDepartmentMutation();
  const createEmployee = useCreateEmployeeMutation();
  const updateEmployee = useUpdateEmployeeMutation();
  const [departmentForm, setDepartmentForm] = useState<DepartmentCreatePayload>(initialDepartmentForm);
  const [form, setForm] = useState<EmployeeCreatePayload>(initialForm);
  const [editForm, setEditForm] = useState<EmployeeEditForm | null>(null);
  const [employeePage, setEmployeePage] = useState(1);
  const canCreateEmployee = permissions.includes("EMPLOYEE_CREATE");
  const canCreateDepartment = permissions.includes("DEPARTMENT_CREATE");
  const canUpdateEmployee = permissions.includes("EMPLOYEE_UPDATE");

  const activeEmployees = employees.filter((employee) => employee.status === "ACTIVE").length;
  const managementCount = employees.filter((employee) => employee.department.code === "MGMT").length;
  const operationCount = employees.filter((employee) => employee.department.code === "OPS").length;
  const error = departmentError ?? employeeError ?? createDepartment.error;
  const selectedDepartmentId = form.departmentId || departments[0]?.id || 0;
  const departmentOptions = departments.map((department) => ({ value: department.id, label: department.name }));
  const statusOptions = Object.entries(employeeStatusMeta).map(([status, meta]) => ({
    value: status as EmployeeStatus,
    label: meta.label
  }));
  const totalEmployeePages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const currentEmployeePage = Math.min(employeePage, totalEmployeePages);
  const paginatedEmployees = useMemo(
    () => employees.slice((currentEmployeePage - 1) * PAGE_SIZE, currentEmployeePage * PAGE_SIZE),
    [currentEmployeePage, employees]
  );
  const departmentFormReady = departmentForm.code.trim().length > 0 && departmentForm.name.trim().length > 0;
  const employeeFormReady =
    form.employeeNo.trim().length > 0 &&
    form.displayName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.positionTitle.trim().length > 0 &&
    selectedDepartmentId > 0 &&
    departments.length > 0;
  const editFormReady =
    editForm !== null &&
    editForm.displayName.trim().length > 0 &&
    editForm.email.trim().length > 0 &&
    editForm.positionTitle.trim().length > 0 &&
    editForm.departmentId > 0 &&
    departments.length > 0;

  const handleCreateDepartment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!departmentFormReady) return;

    createDepartment.mutate(
      {
        code: departmentForm.code.trim(),
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim()
      },
      {
        onSuccess: () => setDepartmentForm(initialDepartmentForm)
      }
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!employeeFormReady) return;

    createEmployee.mutate(
      {
        ...form,
        employeeNo: form.employeeNo.trim(),
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        positionTitle: form.positionTitle.trim(),
        departmentId: selectedDepartmentId
      },
      {
        onSuccess: () => setForm({ ...initialForm, departmentId: selectedDepartmentId })
      }
    );
  };

  const handleStatusChange = (employee: Employee, status: EmployeeStatus) => {
    updateEmployee.mutate({
      id: employee.id,
      payload: {
        displayName: employee.displayName,
        email: employee.email,
        positionTitle: employee.positionTitle,
        status,
        departmentId: employee.department.id
      }
    });
  };

  const handleEditStart = (employee: Employee) => {
    setEditForm({
      id: employee.id,
      displayName: employee.displayName,
      email: employee.email,
      positionTitle: employee.positionTitle,
      status: employee.status,
      departmentId: employee.department.id
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm || !editFormReady) return;

    updateEmployee.mutate(
      {
        id: editForm.id,
        payload: {
          displayName: editForm.displayName.trim(),
          email: editForm.email.trim(),
          positionTitle: editForm.positionTitle.trim(),
          status: editForm.status,
          departmentId: editForm.departmentId
        }
      },
      {
        onSuccess: () => setEditForm(null)
      }
    );
  };

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error)}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="전체 직원" value={`${employees.length}명`} />
        <MetricCard label="재직 인원" value={`${activeEmployees}명`} change="근무 가능" />
        <MetricCard label="부서" value={`${departments.length}개`} />
        <MetricCard label="운영 배치" value={`${operationCount}명`} change={`관리 ${managementCount}명`} />
      </div>

      {canCreateDepartment ? (
        <Panel title="부서 등록" description="직원 배치와 권한 범위에서 사용할 부서를 등록합니다.">
          <form className="grid items-end gap-4 xl:grid-cols-[180px_1fr_1.5fr_auto]" onSubmit={handleCreateDepartment}>
            <TextField
              label="부서 코드"
              value={departmentForm.code}
              onChange={(event) => setDepartmentForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="예: DEV"
              required
            />
            <TextField
              label="부서명"
              value={departmentForm.name}
              onChange={(event) => setDepartmentForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="예: 개발팀"
              required
            />
            <TextField
              label="설명"
              value={departmentForm.description}
              onChange={(event) => setDepartmentForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="부서 역할을 입력해 주세요"
            />
            <Button className="h-11 gap-2" disabled={!departmentFormReady || createDepartment.isPending}>
              <Plus size={17} strokeWidth={2.2} />
              {createDepartment.isPending ? "등록 중" : "등록"}
            </Button>
          </form>
        </Panel>
      ) : null}

      {canCreateEmployee ? (
        <Panel title="직원 등록" description="직원 마스터 정보를 등록합니다. 로그인 계정까지 함께 만들 때는 사용자 관리에서 처리합니다.">
          <form className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]" onSubmit={handleSubmit}>
            <TextField
              label="직원 번호"
              value={form.employeeNo}
              onChange={(event) => setForm((value) => ({ ...value, employeeNo: event.target.value }))}
              placeholder="E-0002"
              required
            />
            <TextField
              label="이름"
              value={form.displayName}
              onChange={(event) => setForm((value) => ({ ...value, displayName: event.target.value }))}
              placeholder="홍길동"
              required
            />
            <TextField
              label="이메일"
              value={form.email}
              onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))}
              placeholder="member@axis.local"
              type="email"
              required
            />
            <TextField
              label="직책"
              value={form.positionTitle}
              onChange={(event) => setForm((value) => ({ ...value, positionTitle: event.target.value }))}
              placeholder="운영 담당자"
              required
            />
            <div className="grid items-end gap-3 md:grid-cols-[1fr_1fr_auto] xl:col-span-5">
              <SelectField
                label="부서"
                value={selectedDepartmentId}
                options={departmentOptions}
                placeholder="부서 선택"
                disabled={departments.length === 0}
                onChange={(departmentId) => setForm((value) => ({ ...value, departmentId }))}
              />
              <SelectField
                label="상태"
                value={form.status}
                options={statusOptions}
                onChange={(status) => setForm((value) => ({ ...value, status }))}
              />
              <Button className="h-11 gap-2" disabled={!employeeFormReady || createEmployee.isPending}>
                <Plus size={17} strokeWidth={2.2} />
                {createEmployee.isPending ? "등록 중" : "등록"}
              </Button>
            </div>
          </form>
          {createEmployee.error ? (
            <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {getErrorMessage(createEmployee.error)}
            </p>
          ) : null}
        </Panel>
      ) : null}

      <Panel title="부서 현황" description="초기 ERP 기준 부서입니다. 이후 조직도, 팀장, 권한 범위와 연결합니다.">
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

      {canUpdateEmployee && editForm ? (
        <Panel title="직원 정보 수정" description="직원 이름, 이메일, 직책, 부서, 재직 상태를 수정합니다.">
          <form className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]" onSubmit={handleEditSubmit}>
            <TextField
              label="이름"
              value={editForm.displayName}
              onChange={(event) => setEditForm((value) => (value ? { ...value, displayName: event.target.value } : value))}
              required
            />
            <TextField
              label="이메일"
              type="email"
              value={editForm.email}
              onChange={(event) => setEditForm((value) => (value ? { ...value, email: event.target.value } : value))}
              required
            />
            <TextField
              label="직책"
              value={editForm.positionTitle}
              onChange={(event) => setEditForm((value) => (value ? { ...value, positionTitle: event.target.value } : value))}
              required
            />
            <SelectField
              label="부서"
              value={editForm.departmentId}
              options={departmentOptions}
              disabled={departments.length === 0}
              onChange={(departmentId) => setEditForm((value) => (value ? { ...value, departmentId } : value))}
            />
            <SelectField
              label="상태"
              value={editForm.status}
              options={statusOptions}
              onChange={(status) => setEditForm((value) => (value ? { ...value, status } : value))}
            />
            <div className="flex items-end gap-2">
              <Button className="h-11" disabled={!editFormReady || updateEmployee.isPending}>
                {updateEmployee.isPending ? "저장 중" : "저장"}
              </Button>
              <Button className="h-11" type="button" variant="secondary" onClick={() => setEditForm(null)}>
                취소
              </Button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel title="직원 목록" description="직원 번호, 부서, 직책, 상태를 한글 업무 용어로 정리합니다.">
        {updateEmployee.error ? (
          <p className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {getErrorMessage(updateEmployee.error)}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-lg border border-axis-border">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
              <tr>
                <th className="px-4 py-3">직원</th>
                <th className="px-4 py-3">부서</th>
                <th className="px-4 py-3">직책</th>
                <th className="px-4 py-3">이메일</th>
                <th className="px-4 py-3">상태</th>
                {canUpdateEmployee ? <th className="px-4 py-3">관리</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-axis-border bg-white">
              {paginatedEmployees.map((employee) => {
                const status = employeeStatusMeta[employee.status];

                return (
                  <tr key={employee.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-axis-ink text-white">
                          <UsersRound size={18} strokeWidth={2.2} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-axis-ink">{employee.displayName}</p>
                          <p className="mt-1 text-xs font-medium text-axis-muted">{employee.employeeNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-axis-ink">{employee.department.name}</p>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-axis-ink">{employee.positionTitle}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-axis-muted">
                        <Mail size={15} strokeWidth={2.2} />
                        {employee.email}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    {canUpdateEmployee ? (
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="h-8 rounded-md border border-axis-border bg-white px-2.5 text-xs font-bold text-axis-ink transition hover:border-axis-ink"
                            type="button"
                            onClick={() => handleEditStart(employee)}
                          >
                            수정
                          </button>
                          {Object.entries(employeeStatusMeta).map(([nextStatus, meta]) => {
                            const typedStatus = nextStatus as EmployeeStatus;
                            const isCurrent = employee.status === typedStatus;

                            return (
                              <button
                                key={nextStatus}
                                className={[
                                  "h-8 rounded-md border px-2.5 text-xs font-bold transition",
                                  isCurrent
                                    ? "border-axis-ink bg-axis-ink text-white"
                                    : "border-axis-border bg-white text-axis-muted hover:border-axis-ink hover:text-axis-ink"
                                ].join(" ")}
                                disabled={isCurrent || updateEmployee.isPending}
                                type="button"
                                onClick={() => handleStatusChange(employee, typedStatus)}
                              >
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
          <Pagination
            page={currentEmployeePage}
            pageSize={PAGE_SIZE}
            totalItems={employees.length}
            onPageChange={setEmployeePage}
          />
        </div>
      </Panel>
    </div>
  );
}
