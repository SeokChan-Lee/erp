import { FormEvent, useMemo, useState } from "react";

import {
  useCreateDepartmentMutation,
  useCreateEmployeeMutation,
  useDepartmentsQuery,
  useEmployeesQuery,
  useUpdateEmployeeMutation
} from "./api/organizationApi";
import type { DepartmentCreatePayload, Employee, EmployeeCreatePayload, EmployeeStatus } from "./api/dto";
import {
  DepartmentCreatePanel,
  DepartmentListPanel,
  EmployeeCreatePanel,
  EmployeeEditPanel,
  EmployeeListPanel,
  OrganizationSummaryCards
} from "./components/OrganizationSections";
import type { EmployeeEditForm } from "./types";
import { employeeStatusMeta } from "../../shared/config/domainLabels";
import { getErrorMessage } from "../../shared/api/http";

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

      <OrganizationSummaryCards
        employeeCount={employees.length}
        activeEmployees={activeEmployees}
        departmentCount={departments.length}
        operationCount={operationCount}
        managementCount={managementCount}
      />

      {canCreateDepartment ? (
        <DepartmentCreatePanel
          form={departmentForm}
          setForm={setDepartmentForm}
          formReady={departmentFormReady}
          createPending={createDepartment.isPending}
          onSubmit={handleCreateDepartment}
        />
      ) : null}

      {canCreateEmployee ? (
        <EmployeeCreatePanel
          form={form}
          setForm={setForm}
          selectedDepartmentId={selectedDepartmentId}
          departmentOptions={departmentOptions}
          statusOptions={statusOptions}
          departmentCount={departments.length}
          formReady={employeeFormReady}
          createPending={createEmployee.isPending}
          error={createEmployee.error}
          onSubmit={handleSubmit}
        />
      ) : null}

      <DepartmentListPanel departments={departments} employees={employees} />

      {canUpdateEmployee && editForm ? (
        <EmployeeEditPanel
          form={editForm}
          setForm={setEditForm}
          departmentOptions={departmentOptions}
          statusOptions={statusOptions}
          departmentCount={departments.length}
          formReady={editFormReady}
          updatePending={updateEmployee.isPending}
          onCancel={() => setEditForm(null)}
          onSubmit={handleEditSubmit}
        />
      ) : null}

      <EmployeeListPanel
        employees={paginatedEmployees}
        totalEmployees={employees.length}
        page={currentEmployeePage}
        pageSize={PAGE_SIZE}
        canUpdate={canUpdateEmployee}
        updatePending={updateEmployee.isPending}
        updateError={updateEmployee.error}
        onPageChange={setEmployeePage}
        onEdit={handleEditStart}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
