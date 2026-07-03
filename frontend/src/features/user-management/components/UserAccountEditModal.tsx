import type { Dispatch, FormEvent, SetStateAction } from "react";
import { LockKeyhole } from "lucide-react";

import type { RoleCode } from "../../../shared/config/accessControlMeta";
import { getRoleMeta } from "../../../shared/config/accessControlMeta";
import { formatAccountDisplayName } from "../../../shared/config/domainLabels";
import { Button } from "../../../shared/ui/Button";
import { Modal } from "../../../shared/ui/Modal";
import { SelectField } from "../../../shared/ui/SelectField";
import { TextField } from "../../../shared/ui/TextField";
import type { UserAccount } from "../api/dto";
import type { UserAccountEditForm } from "../types";
import { InfoItem } from "./UserManagementDisplay";

type SelectOption = {
  value: number;
  label: string;
};

type UserAccountEditModalProps = {
  account: UserAccount | null;
  form: UserAccountEditForm;
  setForm: Dispatch<SetStateAction<UserAccountEditForm>>;
  roleOptions: RoleCode[];
  departmentOptions: SelectOption[];
  departmentsLoading: boolean;
  departmentCount: number;
  canUpdate: boolean;
  editingOwnAccount: boolean;
  passwordMatches: boolean;
  passwordConfirmError?: string;
  hasChanges: boolean;
  updatePending: boolean;
  onToggleRole: (role: RoleCode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export function UserAccountEditModal({
  account,
  form,
  setForm,
  roleOptions,
  departmentOptions,
  departmentsLoading,
  departmentCount,
  canUpdate,
  editingOwnAccount,
  passwordMatches,
  passwordConfirmError,
  hasChanges,
  updatePending,
  onToggleRole,
  onSubmit,
  onClose
}: UserAccountEditModalProps) {
  return (
    <Modal
      open={account !== null}
      title="사용자 계정 수정"
      description="계정 정보를 수정합니다."
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            className={["gap-2", form.active ? "border-rose-200 text-rose-700 hover:border-rose-300" : "border-axis-border-strong"].join(" ")}
            disabled={!canUpdate || editingOwnAccount || updatePending}
            type="button"
            variant="secondary"
            onClick={() => setForm((current) => ({ ...current, active: !current.active }))}
          >
            <LockKeyhole size={16} strokeWidth={2.2} />
            {form.active ? "계정 잠금" : "잠금 해제"}
          </Button>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>취소</Button>
            <Button disabled={!canUpdate || form.roles.length === 0 || !passwordMatches || !hasChanges || updatePending} type="submit" form="user-account-edit-form">
              {updatePending ? "저장 중" : "저장"}
            </Button>
          </div>
        </div>
      }
      onClose={onClose}
    >
      {account ? (
        <form id="user-account-edit-form" className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <InfoItem label="사용자" value={formatAccountDisplayName(account)} />
            <InfoItem label="로그인 ID" value={account.username} />
            <InfoItem label="직책" value={account.employee?.positionTitle ?? "직원 정보 없음"} />
            <InfoItem label="계정 상태" value={form.active ? "사용 가능" : "잠김"} />
          </div>

          {account.employee ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-axis-ink">부서 변경</p>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoItem label="기존 부서" value={account.employee.departmentName} />
                <div className="rounded-lg border border-axis-border bg-axis-bg p-4">
                  <SelectField
                    className="[&>button]:mt-2 [&>span:first-child]:text-xs [&>span:first-child]:font-bold [&>span:first-child]:text-axis-muted"
                    label="변경할 부서"
                    value={form.departmentId}
                    options={departmentOptions}
                    placeholder={departmentsLoading ? "부서 불러오는 중" : "변경할 부서 선택"}
                    disabled={departmentsLoading || departmentCount === 0}
                    onChange={(departmentId) => setForm((current) => ({ ...current, departmentId }))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <InfoItem label="소속" value="미연결" />
          )}

          <TextField label="새 비밀번호" placeholder="변경하지 않으려면 비워두세요." type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          <TextField label="새 비밀번호 확인" placeholder="새 비밀번호를 한 번 더 입력하세요." type="password" value={form.passwordConfirm} error={passwordConfirmError} onChange={(event) => setForm((current) => ({ ...current, passwordConfirm: event.target.value }))} />

          <div>
            <p className="text-sm font-semibold text-axis-ink">역할</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
        </form>
      ) : null}
    </Modal>
  );
}
