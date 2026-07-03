import type { ReactNode } from "react";

type TableFrameProps = {
  children: ReactNode;
  className?: string;
};

export function TableFrame({ children, className = "" }: TableFrameProps) {
  return (
    <div className={["overflow-x-auto rounded-lg border border-axis-border", className].join(" ")}>
      {children}
    </div>
  );
}
