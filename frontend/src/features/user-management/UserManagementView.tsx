import { FormEvent, useMemo, useState } from "react";
import { KeyRound, PencilLine, Plus, UserRoundPlus, UsersRound } from "lucide-react";

import {
  useAvailableEmployeesQuery,
  useCreateEmployeeAccountMutation,
  useCreateUserAccountMutation,
  useUpdateUserAccountMutation,
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
import { Modal } from "../../shared/ui/Modal";
import { Pagination } from "../../shared/ui/Pagination";
import { Panel } from "../../shared/ui/Panel";
import { SelectField } from "../../shared/ui/SelectField";

const PAGE_SIZE = 20;

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

const initialEditForm = {
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
  const updateUserAccount = useUpdateUserAccountMutation();
  const [form, setForm] = useState<EmployeeAccountCreatePayload>(initialForm);
  const [linkForm, setLinkForm] = useState(initialLinkForm);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState(initialEditForm);
  const [accountPage, setAccountPage] = useState(1);
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
    updateUserAccount.error;

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
  const totalAccountPages = Math.max(1, Math.ceil(accounts.length / PAGE_SIZE));
  const currentAccountPage = Math.min(accountPage, totalAccountPages);
  const paginatedAccounts = useMemo(
    () => accounts.slice((currentAccountPage - 1) * PAGE_SIZE, currentAccountPage * PAGE_SIZE),
    [accounts, currentAccountPage]
  );
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

  const openEditModal = (account: UserAccount) => {
    setEditingAccount(account);
    setEditForm({ password: "", roles: account.roles });
  };

  const closeEditModal = () => {
    setEditingAccount(null);
    setEditForm(initialEditForm);
  };

  const toggleEditRole = (targetRole: RoleCode) => {
    setEditForm((current) => {
      const roles = current.roles.includes(targetRole)
        ? current.roles.filter((role) => role !== targetRole)
        : [...current.roles, targetRole];

      return roles.length === 0 ? current : { ...current, roles };
    });
  };

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAccount || !canUpdateRoles || editForm.roles.length === 0) return;

    const password = editForm.password.trim();
    updateUserAccount.mutate(
      {
        userId: editingAccount.id,
        payload: {
          roles: editForm.roles,
          ...(password.length > 0 ? { password } : {})
        }
      },
      {
        onSuccess: closeEditModal
      }
    );
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

      {canCreate ? (
        <Panel title="직원 및 계정 등록" description="신규 직원의 인사 정보와 로그인 계정을 한 번에 등록합니다.">
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
        </Panel>
      ) : null}

      {canCreateUser ? (
        <Panel title="기존 직원 계정 연결" description="직원 마스터에만 등록된 사용자를 ERP 접속 사용자로 전환합니다.">
          <form onSubmit={handleLinkSubmit}>
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
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-axis-border bg-white">
                {paginatedAccounts.map((account) => (
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
                      <Button
                        className="h-9 gap-2 px-3 text-xs"
                        disabled={!canUpdateRoles}
                        type="button"
                        variant="secondary"
                        onClick={() => openEditModal(account)}
                      >
                        <PencilLine size={15} strokeWidth={2.2} />
                        수정
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={currentAccountPage}
              pageSize={PAGE_SIZE}
              totalItems={accounts.length}
              onPageChange={setAccountPage}
            />
          </div>
        )}
      </Panel>

      <Modal
        open={editingAccount !== null}
        title="사용자 계정 수정"
        description="사용자 정보를 확인하고 비밀번호와 역할을 수정합니다."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={closeEditModal}>
              취소
            </Button>
            <Button
              disabled={!canUpdateRoles || editForm.roles.length === 0 || updateUserAccount.isPending}
              type="submit"
              form="user-account-edit-form"
            >
              {updateUserAccount.isPending ? "저장 중" : "저장"}
            </Button>
          </>
        }
        onClose={closeEditModal}
      >
        {editingAccount ? (
          <form id="user-account-edit-form" className="space-y-5" onSubmit={handleEditSubmit}>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem label="사용자" value={formatAccountDisplayName(editingAccount)} />
              <InfoItem label="로그인 ID" value={editingAccount.username} />
              <InfoItem label="소속" value={editingAccount.employee?.departmentName ?? "미연결"} />
              <InfoItem label="직책" value={editingAccount.employee?.positionTitle ?? "직원 정보 없음"} />
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-axis-ink">새 비밀번호</span>
              <input
                className="axis-field mt-2"
                placeholder="변경하지 않으려면 비워두세요."
                type="password"
                value={editForm.password}
                onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            <div>
              <p className="text-sm font-semibold text-axis-ink">역할</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {roleOptions.map((role) => {
                  const checked = editForm.roles.includes(role);

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
                      onClick={() => toggleEditRole(role)}
                    >
                      {getRoleMeta(role).label}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
      <p className="text-xs font-bold text-axis-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-axis-ink">{value}</p>
    </div>
  );
}
