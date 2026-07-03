import { MetricCard } from "../../../shared/ui/MetricCard";

type UserManagementSummaryCardsProps = {
  totalAccounts: number;
  activeAccountCount: number;
  roleCount: number;
};

export function UserManagementSummaryCards({ totalAccounts, activeAccountCount, roleCount }: UserManagementSummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard label="조회 결과" value={`${totalAccounts}명`} change="조건 기준" />
      <MetricCard label="현재 페이지 사용 가능" value={`${activeAccountCount}명`} change="접속 허용" />
      <MetricCard label="역할 유형" value={`${roleCount}개`} change="권한 기준" />
    </div>
  );
}
