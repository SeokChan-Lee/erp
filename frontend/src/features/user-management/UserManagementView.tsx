import { FormEvent, useMemo, useState } from "react";

import {
  useAvailableEmployeesQuery,
  useCreateEmployeeAccountMutation,
  useCreateUserAccountMutation,
  useUpdateUserAccountMutation,
  useUserAccountsQuery,
  useUserManagementDepartmentsQuery
} from "./api/userManagementApi";
import type {
  EmployeeAccountCreatePayload,
  UserAccount,
  UserAccountRoleFilter,
  UserAccountsQueryParams,
  UserAccountStatusFilter
} from "./api/dto";
import { getErrorMessage } from "../../shared/api/http";
import type { RoleCode } from "../../shared/config/accessControlMeta";
import { getRoleMeta, roleMeta } from "../../shared/config/accessControlMeta";
import { employeeStatusMeta } from "../../shared/config/domainLabels";
import { EmployeeAccountCreatePanel } from "./components/EmployeeAccountCreatePanel";
import { ExistingEmployeeAccountLinkPanel } from "./components/ExistingEmployeeAccountLinkPanel";
import { UserAccountEditModal } from "./components/UserAccountEditModal";
import { UserAccountListPanel } from "./components/UserAccountListPanel";
import { UserManagementSummaryCards } from "./components/UserManagementSummaryCards";
import type { UserAccountCreateForm, UserAccountEditForm } from "./types";

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
} satisfies UserAccountCreateForm;

const initialEditForm: UserAccountEditForm = {
  password: "",
  passwordConfirm: "",
  departmentId: 0,
  roles: ["EMPLOYEE"] as RoleCode[],
  active: true
};

export function UserManagementView({
  currentUsername,
  permissions = []
}: {
  currentUsername: string;
  permissions?: string[];
}) {
  const { data: departments = [], error: departmentsError, isLoading: departmentsLoading } = useUserManagementDepartmentsQuery();
  const [accountPage, setAccountPage] = useState(1);
  const [accountSearchInput, setAccountSearchInput] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState<UserAccountStatusFilter>("ALL");
  const [accountRoleFilter, setAccountRoleFilter] = useState<UserAccountRoleFilter>("ALL");
  const userAccountsParams = useMemo<UserAccountsQueryParams>(
    () => ({
      page: accountPage,
      pageSize: PAGE_SIZE,
      search: accountSearch,
      status: accountStatusFilter,
      role: accountRoleFilter
    }),
    [accountPage, accountRoleFilter, accountSearch, accountStatusFilter]
  );
  const { data: accountsPage, error: accountsError, isLoading: accountsLoading } = useUserAccountsQuery(userAccountsParams);
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
  const accountStatusOptions = useMemo(
    () => [
      { value: "ALL" as UserAccountStatusFilter, label: "전체" },
      { value: "ACTIVE" as UserAccountStatusFilter, label: "사용 가능" },
      { value: "INACTIVE" as UserAccountStatusFilter, label: "비활성" }
    ],
    []
  );
  const accountRoleOptions = useMemo(
    () => [
      { value: "ALL" as UserAccountRoleFilter, label: "전체 역할" },
      ...roleOptions.map((role) => ({ value: role as UserAccountRoleFilter, label: getRoleMeta(role).label }))
    ],
    [roleOptions]
  );
  const accounts = accountsPage?.content ?? [];
  const totalAccounts = accountsPage?.totalItems ?? 0;
  const activeAccountCount = accounts.filter((account) => account.employee !== null && account.active).length;
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
  const editingOwnAccount = editingAccount?.username === currentUsername;
  const editPassword = editForm.password.trim();
  const editPasswordConfirm = editForm.passwordConfirm.trim();
  const editPasswordChanging = editPassword.length > 0 || editPasswordConfirm.length > 0;
  const editPasswordMatches = !editPasswordChanging || (editPassword.length > 0 && editPassword === editPasswordConfirm);
  const editPasswordConfirmError =
    editPasswordChanging && editPasswordConfirm.length === 0
      ? "새 비밀번호를 한 번 더 입력해 주세요."
      : editPasswordChanging && !editPasswordMatches
        ? "새 비밀번호가 서로 다릅니다."
        : undefined;
  const departmentChanged =
    Boolean(editingAccount?.employee) &&
    editForm.departmentId > 0 &&
    editForm.departmentId !== editingAccount?.employee?.departmentId;
  const rolesChanged =
    editingAccount !== null &&
    (editForm.roles.length !== editingAccount.roles.length ||
      editForm.roles.some((role) => !editingAccount.roles.includes(role)));
  const activeChanged = editingAccount !== null && editForm.active !== editingAccount.active;
  const passwordChanged = editPassword.length > 0 && editPasswordMatches;
  const hasEditChanges = departmentChanged || rolesChanged || activeChanged || passwordChanged;

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
    setEditForm({
      password: "",
      passwordConfirm: "",
      departmentId: account.employee?.departmentId ?? 0,
      roles: account.roles,
      active: account.active
    });
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
    if (!editingAccount || !canUpdateRoles || editForm.roles.length === 0 || !editPasswordMatches || !hasEditChanges) return;

    updateUserAccount.mutate(
      {
        userId: editingAccount.id,
        payload: {
          roles: editForm.roles,
          active: editForm.active,
          ...(departmentChanged ? { departmentId: editForm.departmentId } : {}),
          ...(editPassword.length > 0 ? { password: editPassword } : {})
        }
      },
      {
        onSuccess: closeEditModal
      }
    );
  };

  const resetAccountFilters = () => {
    setAccountSearchInput("");
    setAccountSearch("");
    setAccountStatusFilter("ALL");
    setAccountRoleFilter("ALL");
    setAccountPage(1);
  };

  return (
    <div className="space-y-6">
      {pageError ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(pageError)}
        </p>
      ) : null}

      <UserManagementSummaryCards totalAccounts={totalAccounts} activeAccountCount={activeAccountCount} roleCount={roleOptions.length} />

      {canCreate ? (
        <EmployeeAccountCreatePanel
          form={form}
          setForm={setForm}
          selectedDepartmentId={selectedDepartmentId}
          departmentOptions={departmentOptions}
          statusOptions={statusOptions}
          roleOptions={roleOptions}
          departmentsLoading={departmentsLoading}
          departmentCount={departments.length}
          formReady={formReady}
          createPending={createEmployeeAccount.isPending}
          onToggleRole={toggleFormRole}
          onSubmit={handleSubmit}
        />
      ) : null}

      {canCreateUser ? (
        <ExistingEmployeeAccountLinkPanel
          form={linkForm}
          setForm={setLinkForm}
          selectedEmployeeId={selectedEmployeeId}
          employeeOptions={availableEmployeeOptions}
          roleOptions={roleOptions}
          employeesLoading={availableEmployeesLoading}
          employeeCount={availableEmployees.length}
          formReady={linkFormReady}
          createPending={createUserAccount.isPending}
          onToggleRole={toggleLinkFormRole}
          onSubmit={handleLinkSubmit}
        />
      ) : null}

      <UserAccountListPanel
        accounts={accounts}
        totalAccounts={totalAccounts}
        page={accountPage}
        pageSize={PAGE_SIZE}
        searchInput={accountSearchInput}
        status={accountStatusFilter}
        role={accountRoleFilter}
        statusOptions={accountStatusOptions}
        roleOptions={accountRoleOptions}
        loading={accountsLoading}
        canUpdate={canUpdateRoles}
        onSearchInputChange={setAccountSearchInput}
        onApplySearch={() => {
          setAccountSearch(accountSearchInput.trim());
          setAccountPage(1);
        }}
        onStatusChange={(status) => {
          setAccountStatusFilter(status);
          setAccountPage(1);
        }}
        onRoleChange={(role) => {
          setAccountRoleFilter(role);
          setAccountPage(1);
        }}
        onResetFilters={resetAccountFilters}
        onPageChange={setAccountPage}
        onEdit={openEditModal}
      />

      <UserAccountEditModal
        account={editingAccount}
        form={editForm}
        setForm={setEditForm}
        roleOptions={roleOptions}
        departmentOptions={departmentOptions}
        departmentsLoading={departmentsLoading}
        departmentCount={departments.length}
        canUpdate={canUpdateRoles}
        editingOwnAccount={editingOwnAccount}
        passwordMatches={editPasswordMatches}
        passwordConfirmError={editPasswordConfirmError}
        hasChanges={hasEditChanges}
        updatePending={updateUserAccount.isPending}
        onToggleRole={toggleEditRole}
        onSubmit={handleEditSubmit}
        onClose={closeEditModal}
      />
    </div>
  );
}
