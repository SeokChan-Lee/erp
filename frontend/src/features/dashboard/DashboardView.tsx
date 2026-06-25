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
  const pendingPurchaseRequests = summary?.pendingPurchaseRequests ?? 0;
  const pendingPurchaseReceipts = summary?.pendingPurchaseReceipts ?? 0;
  const registeredSalesOrders = summary?.registeredSalesOrders ?? 0;
  const pendingSalesShipments = summary?.pendingSalesShipments ?? 0;
  const recentActivityItems = summary?.recentActivityItems ?? [];

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
        <MetricCard label="오늘 처리" value={`${recentActivities}건`} />
        <MetricCard label="구매 승인 대기" value={`${pendingPurchaseRequests}건`} />
        <MetricCard label="구매 입고 대기" value={`${pendingPurchaseReceipts}건`} />
        <MetricCard label="판매 수주" value={`${registeredSalesOrders}건`} />
        <MetricCard label="판매 출고 대기" value={`${pendingSalesShipments}건`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="운영 처리 대기" description="오늘 바로 판단해야 하는 업무를 실제 데이터 기준으로 집계합니다.">
          <div className="divide-y divide-axis-border">
            {[
              { label: "근태/구매 승인 검토", value: `${pendingApprovals}건` },
              { label: "구매 입고 처리", value: `${pendingPurchaseReceipts}건` },
              { label: "판매 출고 처리", value: `${pendingSalesShipments}건` },
              { label: "재고 부족 품목 확인", value: `${lowStockItems}건` }
            ].map(
              (item) => (
                <div key={item.label} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-axis-ink">{item.label}</p>
                    <p className="mt-1 text-sm text-axis-muted">담당 권한을 가진 관리자에게 배정됩니다.</p>
                  </div>
                  <span className="rounded-full bg-axis-bg px-3 py-1 text-xs font-semibold text-axis-muted">
                    {item.value}
                  </span>
                </div>
              )
            )}
          </div>
        </Panel>

        <Panel title="최근 활동" description="구매, 판매, 재고 처리 내역을 최신순으로 확인합니다.">
          {recentActivityItems.length > 0 ? (
            <div className="divide-y divide-axis-border">
              {recentActivityItems.map((activity) => (
                <div key={activity.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <ActivityBadge type={activity.type} />
                        <p className="text-sm font-bold text-axis-ink">{activity.label}</p>
                      </div>
                      <p className="mt-2 truncate text-sm font-semibold text-axis-muted">{activity.description}</p>
                      <p className="mt-1 text-xs font-semibold text-axis-muted">{activity.referenceNo} · {formatProcessorName(activity.processedBy)}</p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-axis-muted">{formatDateTime(activity.occurredAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-axis-border bg-axis-bg px-4 py-5 text-sm font-semibold text-axis-muted">
              최근 활동이 없습니다.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function ActivityBadge({ type }: { type: "INVENTORY" | "PURCHASE" | "SALES" }) {
  const meta =
    type === "PURCHASE"
      ? { label: "구매", className: "bg-blue-50 text-blue-700" }
      : type === "SALES"
        ? { label: "판매", className: "bg-violet-50 text-violet-700" }
        : { label: "재고", className: "bg-emerald-50 text-emerald-700" };

  return <span className={["inline-flex h-6 items-center rounded-full px-2 text-xs font-bold", meta.className].join(" ")}>{meta.label}</span>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatProcessorName(value: string) {
  if (value === "admin") return "시스템 관리자";
  return value.trim() || "-";
}
