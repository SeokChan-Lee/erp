import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { useLogoutMutation } from "../../features/auth/api/authApi";
import type { AuthUser } from "../../features/auth/api/dto";
import { getRoleMeta } from "../../shared/config/accessControlMeta";
import { formatAccountDisplayName } from "../../shared/config/domainLabels";

type AccountMenuProps = {
  user: AuthUser;
};

export function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const logoutMutation = useLogoutMutation();
  const ref = useRef<HTMLDivElement | null>(null);
  const displayName = formatAccountDisplayName(user);
  const employee = user.employee;
  const profileSummary = employee ? `${employee.departmentName} · ${employee.positionTitle}` : user.roles.map((role) => getRoleMeta(role).label).join(", ");

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-axis-border-strong bg-white px-2 text-left transition hover:border-axis-ink focus:outline-none focus-visible:outline-none sm:h-12 sm:min-w-[188px] sm:gap-3 sm:px-3"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-axis-ink text-white">
          <UserRound size={17} strokeWidth={2.3} />
        </span>
        <span className="hidden min-w-0 flex-1 md:block">
          <span className="block text-[15px] font-bold leading-5 text-axis-ink">{displayName}</span>
          <span className="block truncate text-[13px] font-medium leading-4 text-[#424245]">
            {profileSummary}
          </span>
        </span>
        <ChevronDown className={open ? "shrink-0 rotate-180 text-axis-ink transition" : "shrink-0 text-axis-ink transition"} size={17} strokeWidth={2.4} />
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-30 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-xl border border-axis-border-strong bg-white">
          <div className="border-b border-axis-border px-5 py-5">
            <p className="text-[15px] font-bold leading-5 text-axis-ink">{displayName}</p>
            <p className="mt-1 text-[13px] font-medium leading-5 text-[#424245]">
              {employee ? `${employee.departmentName} 소속 ${employee.positionTitle}` : "직원 정보가 연결되지 않은 계정입니다."}
            </p>
            <div className="mt-4 grid gap-2">
              <AccountInfoRow label="아이디" value={user.username} />
              <AccountInfoRow label="부서" value={employee?.departmentName ?? "미연결"} />
              <AccountInfoRow label="직책" value={employee?.positionTitle ?? "미연결"} />
              <AccountInfoRow label="이메일" value={employee?.email ?? "미연결"} />
              <AccountInfoRow label="직원 번호" value={employee?.employeeNo ?? "미연결"} />
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <span key={role} className="rounded-full bg-axis-bg px-2.5 py-1 text-xs font-bold text-[#424245]">
                  {getRoleMeta(role).label}
                </span>
              ))}
            </div>
          </div>

          <div className="p-2.5">
            <Link
              className="flex h-11 items-center rounded-lg px-3 text-[14px] font-bold text-axis-ink hover:bg-axis-bg focus:outline-none focus-visible:outline-none"
              to="/my-page"
              onClick={() => setOpen(false)}
            >
              마이페이지
            </Link>
            <button
              className="flex h-11 w-full items-center gap-2 rounded-lg px-3 text-[14px] font-bold text-rose-600 hover:bg-rose-50 focus:outline-none focus-visible:outline-none"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut size={17} strokeWidth={2.3} />
              로그아웃
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AccountInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-axis-bg px-3 py-2">
      <span className="shrink-0 text-xs font-bold text-axis-muted">{label}</span>
      <span className="truncate text-xs font-bold text-axis-ink">{value}</span>
    </div>
  );
}
