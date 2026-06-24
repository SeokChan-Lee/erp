import { useDashboardSummaryQuery } from "./api/dashboardApi";
import { getErrorMessage } from "../../shared/api/http";
import { MetricCard } from "../../shared/ui/MetricCard";
import { Panel } from "../../shared/ui/Panel";

export function DashboardView() {
  const { data: summary, error } = useDashboardSummaryQuery();

  const checkedIn = summary?.checkedIn ?? 0;
  const pendingApprovals = summary?.pendingApprovals ?? 0;
  const lowStockItems = summary?.lowStockItems ?? 0;
  const recentActivities = summary?.recentActivities ?? 0;

  const workSignals = [
    { label: "승인 대기", value: String(pendingApprovals), tone: "text-axis-blue" },
    { label: "재고 경고", value: String(lowStockItems), tone: "text-amber-600" },
    { label: "최근 활동", value: String(recentActivities), tone: "text-rose-600" }
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl bg-axis-ink px-8 py-7 text-white">
        <p className="text-sm font-semibold text-white/60">Axis ERP</p>
        <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-normal">회사 운영 현황을 한 화면에서 확인합니다.</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/70">
              출퇴근, 권한, 재고 경고, 승인 업무를 먼저 안정화하고 구매와 판매 업무로 확장합니다.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {workSignals.map((item) => (
              <div key={item.label} className="min-w-[128px] rounded-lg bg-white px-4 py-3 text-axis-ink">
                <p className="text-xs font-medium text-axis-muted">{item.label}</p>
                <strong className={`mt-2 block text-2xl font-semibold ${item.tone}`}>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {getErrorMessage(error)}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="오늘 출근" value={`${checkedIn}명`} change="실시간" />
        <MetricCard label="승인 대기" value={`${pendingApprovals}건`} />
        <MetricCard label="재고 경고" value={`${lowStockItems}건`} />
        <MetricCard label="최근 활동" value={`${recentActivities}건`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="운영 처리 대기" description="초기 대시보드는 오늘 바로 판단해야 하는 업무를 중심으로 구성합니다.">
          <div className="divide-y divide-axis-border">
            {["근태 수정 요청 검토", "구매 요청 승인", "재고 부족 품목 확인"].map(
              (item) => (
                <div key={item} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-axis-ink">{item}</p>
                    <p className="mt-1 text-sm text-axis-muted">담당 권한을 가진 관리자에게 배정됩니다.</p>
                  </div>
                  <span className="rounded-full bg-axis-bg px-3 py-1 text-xs font-semibold text-axis-muted">
                    준비됨
                  </span>
                </div>
              )
            )}
          </div>
        </Panel>

        <Panel title="MVP 구현 순서" description="핵심 흐름이 안정될 때까지 범위를 작게 유지합니다.">
          <ol className="space-y-3">
            {["인증과 권한", "직원과 출퇴근", "대시보드 요약", "품목과 재고 기본"].map(
              (item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-axis-ink text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-medium text-axis-ink">{item}</span>
                </li>
              )
            )}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
