import { CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "info";

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
};

export function Toast({ open, message, variant = "info", onClose }: ToastProps) {
  if (!open) return null;

  const Icon = variant === "success" ? CheckCircle2 : Info;

  return (
    <div className="fixed right-6 top-20 z-[240] w-[min(360px,calc(100vw-32px))] rounded-lg border border-axis-border-strong bg-white">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={["mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full", variant === "success" ? "bg-emerald-50 text-emerald-700" : "bg-axis-bg text-axis-ink"].join(" ")}>
          <Icon size={17} strokeWidth={2.3} />
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-6 text-axis-ink">{message}</p>
        <button
          aria-label="알림 닫기"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-axis-muted transition hover:bg-axis-bg hover:text-axis-ink"
          type="button"
          onClick={onClose}
        >
          <X size={16} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
