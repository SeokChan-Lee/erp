import { FormEvent, useMemo, useState } from "react";
import { KeyRound, Plus, UserRoundPlus, UsersRound } from "lucide-react";

import {
  useAvailableEmployeesQuery,
  useCreateEmployeeAccountMutation,
  useCreateUserAccountMutation,
  useUpdateUserRolesMutation,
  useUserAccountsQuery,
  useUserManagementDepartmentsQuery
} from "./api/userManagementApi";
import type { EmployeeAccountCreatePayload, UserAccount } from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import type { RoleCode } from "../../shared/config/accessControlMeta";
import { getRoleMeta, roleMeta } from "../../shared/config/accessControlMeta";
import { employeeStatusMeta, formatAccountDisplayName, formatRoleList } from "../../shared/config/domainLabels";
import { Button } from "../../shared/ui/Button";
import { MetricCard } from "../../shared/ui/MetricCard";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";

const initialForm: EmployeeAccountCreatePayload = {
  employeeNo: "",
  displayName: "",
  email: "",
  positionTitle: "",
  status: "ACTIVE",
  departmentId: 0,
  username: "",
  password: "",
  roles: ["EMPLOYEE"]
};

const initialLinkForm = {
  employeeId: 0,
  username: "",
  password: "",
  roles: ["EMPLOYEE"] as RoleCode[]
};

export function UserManagementView({ permissions = [] }: { permissions?: string[] }) {
  const { data: departments = [], error: departmentsError, isLoading: departmentsLoading } = useUserManagementDepartmentsQuery();
  const { data: accounts = [], error: accountsError, isLoading: accountsLoading } = useUserAccountsQuery();
  const {
    data: availableEmployees = [],
    error: availableEmployeesError,
    isLoading: availableEmployeesLoading
  } = useAvailableEmployeesQuery();
  const createEmployeeAccount = useCreateEmployeeAccountMutation();
  const createUserAccount = useCreateUserAccountMutation();
  const updateUserRoles = useUpdateUserRolesMutation();
  const [form, setForm] = useState<EmployeeAccountCreatePayload>(initialForm);
  const [linkForm, setLinkForm] = useState(initialLinkForm);
  const canCreate = permissions.includes("EMPLOYEE_CREATE") && permissions.includes("USER_CREATE");
  const canCreateUser = permissions.includes("USER_CREATE");
  const canUpdateRoles = permissions.includes("USER_UPDATE");
  const selectedDepartmentId = form.departmentId || departments[0]?.id || 0;
  const selectedEmployeeId = linkForm.employeeId || availableEmployees[0]?.id || 0;
  const pageError =
    departmentsError ||
    accountsError ||
    availableEmployeesError ||
    createEmployeeAccount.error ||
    createUserAccount.error ||
    updateUserRoles.error;

  const departmentOptions = useMemo(
    () => departments.map((department) => ({ value: department.id, label: department.name })),
    [departments]
  );
  const statusOptions = useMemo(
    () =>
      Object.entries(employeeStatusMeta).map(([status, meta]) => ({
        value: status as EmployeeAccountCreatePayload["status"],
        label: meta.label
      })),
    []
  );
  const roleOptions = useMemo(() => Object.keys(roleMeta) as RoleCode[], []);
  const availableEmployeeOptions = useMemo(
    () =>
      availableEmployees.map((employee) => ({
        value: employee.id,
        label: `${employee.displayName} · ${employee.department.name} · ${employee.positionTitle}`
      })),
    [availableEmployees]
  );
  const activeAccountCount = accounts.filter((account) => account.employee !== null).length;
  const formReady =
    selectedDepartmentId > 0 &&
    form.employeeNo.trim().length > 0 &&
    form.displayName.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.positionTitle.trim().length > 0 &&
    form.username.trim().length > 0 &&
    form.password.length >= 4 &&
    form.roles.length > 0;
  const linkFormReady =
    selectedEmployeeId > 0 &&
    linkForm.username.trim().length > 0 &&
    linkForm.password.length >= 4 &&
    linkForm.roles.length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate || !formReady) return;

    createEmployeeAccount.mutate(
      {
        ...form,
        employeeNo: form.employeeNo.trim(),
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        positionTitle: form.positionTitle.trim(),
        username: form.username.trim(),
        departmentId: selectedDepartmentId
      },
      {
        onSuccess: () => setForm({ ...initialForm, departmentId: selectedDepartmentId })
      }
    );
  };

  const toggleFormRole = (targetRole: RoleCode) => {
    setForm((current) => {
      const roles = current.roles.includes(targetRole)
        ? current.roles.filter((role) => role !== targetRole)
        : [...current.roles, targetRole];

      return roles.length === 0 ? current : { ...current, roles };
    });
  };

  const toggleLinkFormRole = (targetRole: RoleCode) => {
    setLinkForm((current) => {
      const roles = current.roles.includes(targetRole)
        ? current.roles.filter((role) => role !== targetRole)
        : [...current.roles, targetRole];

      return roles.length === 0 ? current : { ...current, roles };
    });
  };

  const handleLinkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateUser || !linkFormReady) return;

    createUserAccount.mutate(
      {
        username: linkForm.username.trim(),
        password: linkForm.password,
        employeeId: selectedEmployeeId,
        roles: linkForm.roles
      },
      {
        onSuccess: () => setLinkForm(initialLinkForm)
      }
    );
  };

  const toggleAccountRole = (account: UserAccount, targetRole: RoleCode) => {
    if (!canUpdateRoles || updateUserRoles.isPending) return;
    const roles = account.roles.includes(targetRole)
      ? account.roles.filter((role) => role !== targetRole)
      : [...account.roles, targetRole];

    if (roles.length === 0) return;
    updateUserRoles.mutate({ userId: account.id, payload: { roles } });
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="로그인 사용자" value={`${accounts.length}명`} change="ERP 접속 가능" />
        <MetricCard label="직원 연결" value={`${activeAccountCount}명`} change="직원 마스터 연동" />
        <MetricCard label="역할 유형" value={`${roleOptions.length}개`} change="권한 기준" />
      </div>

      {canCreate || canCreateUser ? (
        <Panel title="직원 및 계정 등록" description="신규 직원은 계정까지 한 번에 만들고, 이미 등록된 직원은 계정만 연결합니다.">
          {canCreate ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="border-b border-axis-border pb-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
                  <UserRoundPlus size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-axis-ink">직원 정보</h3>
                  <p className="mt-1 text-xs font-medium text-axis-muted">조직에서 관리할 직원 마스터 정보입니다.</p>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-4">
                <label className="block">
                  <span className="text-sm font-semibold text-axis-ink">직원 번호</span>
                  <input
                    className="axis-field mt-2"
                    placeholder="E-0002"
                    value={form.employeeNo}
                    onChange={(event) => setForm((current) => ({ ...current, employeeNo: event.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-axis-ink">이름</span>
                  <input
                    className="axis-field mt-2"
                    placeholder="홍길동"
                    value={form.displayName}
                    onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-axis-ink">이메일</span>
                  <input
                    className="axis-field mt-2"
                    placeholder="member@axis.local"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-axis-ink">직책</span>
                  <input
                    className="axis-field mt-2"
                    placeholder="운영 담당자"
                    value={form.positionTitle}
                    onChange={(event) => setForm((current) => ({ ...current, positionTitle: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <SelectField
                  label="부서"
                  value={selectedDepartmentId}
                  options={departmentOptions}
                  placeholder={departmentsLoading ? "부서 불러오는 중" : "부서 선택"}
                  disabled={departmentsLoading || departments.length === 0}
                  onChange={(departmentId) => setForm((current) => ({ ...current, departmentId }))}
                />
                <SelectField
                  label="상태"
                  value={form.status}
                  options={statusOptions}
                  onChange={(status) => setForm((current) => ({ ...current, status }))}
                />
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
                  <KeyRound size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-axis-ink">로그인 설정</h3>
                  <p className="mt-1 text-xs font-medium text-axis-muted">접속 계정과 업무 역할을 함께 지정합니다.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-axis-ink">로그인 ID</span>
                  <input
                    className="axis-field mt-2"
                    placeholder="예: hong.gildong"
                    value={form.username}
                    onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-axis-ink">초기 비밀번호</span>
                  <input
                    className="axis-field mt-2"
                    placeholder="4자 이상"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </label>
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
                          checked
                            ? "border-axis-ink bg-axis-ink text-white"
                            : "border-axis-border bg-white text-axis-ink hover:border-axis-border-strong"
                        ].join(" ")}
                        type="button"
                        onClick={() => toggleFormRole(role)}
                      >
                        {getRoleMeta(role).label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <div className="flex justify-end">
              <Button className="h-11 gap-2" disabled={!formReady || createEmployeeAccount.isPending || departments.length === 0}>
                <Plus size={17} strokeWidth={2.2} />
                {createEmployeeAccount.isPending ? "등록 중" : "직원 및 계정 등록"}
              </Button>
            </div>
          </form>
          ) : null}

          {canCreateUser ? (
          <form className={canCreate ? "mt-6 border-t border-axis-border pt-6" : ""} onSubmit={handleLinkSubmit}>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-axis-bg text-axis-ink">
                <KeyRound size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-axis-ink">기존 직원 계정 연결</h3>
                <p className="mt-1 text-xs font-medium text-axis-muted">직원 마스터에만 등록된 사용자를 ERP 접속 사용자로 전환합니다.</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
              <SelectField
                label="직원"
                value={selectedEmployeeId}
                options={availableEmployeeOptions}
                placeholder={availableEmployeesLoading ? "직원 불러오는 중" : "계정이 없는 직원 선택"}
                disabled={availableEmployeesLoading || availableEmployees.length === 0}
                onChange={(employeeId) => setLinkForm((current) => ({ ...current, employeeId }))}
              />
              <label className="block">
                <span className="text-sm font-semibold text-axis-ink">로그인 ID</span>
                <input
                  className="axis-field mt-2"
                  placeholder="예: hong.gildong"
                  value={linkForm.username}
                  onChange={(event) => setLinkForm((current) => ({ ...current, username: event.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-axis-ink">초기 비밀번호</span>
                <input
                  className="axis-field mt-2"
                  placeholder="4자 이상"
                  type="password"
                  value={linkForm.password}
                  onChange={(event) => setLinkForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-axis-ink">역할</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {roleOptions.map((role) => {
                  const checked = linkForm.roles.includes(role);

                  return (
                    <button
                      key={role}
                      aria-pressed={checked}
                      className={[
                        "min-h-11 rounded-lg border px-3 text-left text-sm font-bold transition",
                        checked
                          ? "border-axis-ink bg-axis-ink text-white"
                          : "border-axis-border bg-white text-axis-ink hover:border-axis-border-strong"
                      ].join(" ")}
                      type="button"
                      onClick={() => toggleLinkFormRole(role)}
                    >
                      {getRoleMeta(role).label}
                    </button>
                  );
                })}
              </div>
            </div>

            {availableEmployees.length === 0 ? (
              <p className="mt-4 rounded-lg bg-axis-bg px-4 py-3 text-sm font-semibold text-axis-muted">
                계정을 연결할 수 있는 기존 직원이 없습니다.
              </p>
            ) : null}

            <div className="mt-5 flex justify-end">
              <Button className="h-11 gap-2" disabled={!linkFormReady || createUserAccount.isPending || availableEmployees.length === 0}>
                <Plus size={17} strokeWidth={2.2} />
                {createUserAccount.isPending ? "연결 중" : "계정 연결"}
              </Button>
            </div>
          </form>
          ) : null}
        </Panel>
      ) : null}

      <Panel title="등록된 사용자 역할 관리" description="ERP에 접속할 수 있는 직원과 현재 부여된 역할을 확인하고 수정합니다.">
        {accountsLoading ? (
          <p className="text-sm font-semibold text-axis-muted">사용자 현황을 불러오는 중입니다.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-axis-border">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead className="bg-axis-bg text-xs font-semibold text-axis-muted">
                <tr>
                  <th className="px-4 py-3">사용자</th>
                  <th className="px-4 py-3">소속</th>
                  <th className="px-4 py-3">현재 역할</th>
                  <th className="px-4 py-3">역할 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-axis-ink text-white">
                          <UsersRound size={18} strokeWidth={2.2} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-axis-ink">{formatAccountDisplayName(account)}</p>
                          <p className="mt-1 text-xs font-medium text-axis-muted">
                            {account.employee?.positionTitle ?? "직원 정보 없음"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-axis-ink">
                      {account.employee?.departmentName ?? "미연결"}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-axis-muted">{formatRoleList(account.roles)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {roleOptions.map((role) => {
                          const checked = account.roles.includes(role);
                          return (
                            <button
                              key={role}
                              aria-pressed={checked}
                              className={[
                                "h-8 rounded-md border px-2.5 text-xs font-bold transition",
                                checked
                                  ? "border-axis-ink bg-axis-ink text-white"
                                  : "border-axis-border bg-white text-axis-muted hover:border-axis-ink hover:text-axis-ink"
                              ].join(" ")}
                              disabled={!canUpdateRoles || updateUserRoles.isPending}
                              type="button"
                              onClick={() => toggleAccountRole(account, role)}
                            >
                              {getRoleMeta(role).label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
