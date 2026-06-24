import type { ReactNode } from "react";

type PanelProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function Panel({ title, description, children }: PanelProps) {
  return (
    <section className="rounded-lg border border-axis-border bg-white p-5 shadow-panel">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-axis-ink">{title}</h2>
        {description ? <p className="mt-1 text-sm text-axis-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

