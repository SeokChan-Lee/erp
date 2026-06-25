import { useEffect, useState } from "react";
import { CheckCircle2, Info, X } from "lucide-react";

type ToastVariant = "success" | "info";

type ToastProps = {
  open: boolean;
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
};

export function Toast({ open, message, variant = "info", onClose }: ToastProps) {
  const [mounted, setMounted] = useState(open);
  const [displayMessage, setDisplayMessage] = useState(message);

  useEffect(() => {
    if (open) {
      setDisplayMessage(message);
      setMounted(true);
      return;
    }

    const timerId = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timerId);
  }, [message, open]);

  if (!mounted) return null;

  const Icon = variant === "success" ? CheckCircle2 : Info;

  return (
    <div
      className={[
        "fixed bottom-6 right-6 z-[240] w-[min(380px,calc(100vw-32px))] rounded-lg border border-axis-border-strong bg-white",
        open ? "axis-toast-enter" : "axis-toast-exit"
      ].join(" ")}
    >
      <div className="grid min-h-[64px] grid-cols-[36px_1fr_32px] items-center gap-3 px-4 py-3">
        <span className={["flex h-9 w-9 shrink-0 items-center justify-center rounded-full", variant === "success" ? "bg-emerald-50 text-emerald-700" : "bg-axis-bg text-axis-ink"].join(" ")}>
          <Icon size={17} strokeWidth={2.3} />
        </span>
        <p className="min-w-0 text-sm font-semibold leading-5 text-axis-ink">{displayMessage}</p>
        <button
          aria-label="알림 닫기"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-axis-muted transition hover:bg-axis-bg hover:text-axis-ink"
          type="button"
          onClick={onClose}
        >
          <X size={16} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}
