import type { ReactNode } from "react";

type TableFrameProps = {
  children: ReactNode;
  className?: string;
};

export function TableFrame({ children, className = "" }: TableFrameProps) {
  return (
    <div className={["min-w-0 max-w-full overflow-x-auto rounded-lg border border-axis-border", className].join(" ")}>
      {children}
    </div>
  );
}
