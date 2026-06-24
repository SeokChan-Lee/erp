type MetricCardProps = {
  label: string;
  value: string;
  change?: string;
};

export function MetricCard({ label, value, change }: MetricCardProps) {
  return (
    <section className="rounded-lg border border-axis-border bg-white p-5 shadow-panel">
      <p className="text-sm font-medium text-axis-muted">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold tracking-normal text-axis-ink">{value}</strong>
        {change ? <span className="text-sm font-semibold text-axis-blue">{change}</span> : null}
      </div>
    </section>
  );
}

