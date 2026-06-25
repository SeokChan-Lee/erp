import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, description, children, footer, onClose }: ModalProps) {
  if (!open) return null;

  return createPortal(
    <div className="fixed left-0 top-0 z-[100] h-dvh w-screen overflow-y-auto bg-black/40">
      <div className="flex min-h-full w-full items-center justify-center px-4 py-6">
        <section className="w-full max-w-2xl overflow-hidden rounded-xl border border-axis-border-strong bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-axis-border px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-axis-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium text-axis-muted">{description}</p> : null}
          </div>
          <button
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-axis-muted transition hover:bg-axis-bg hover:text-axis-ink"
            type="button"
            onClick={onClose}
          >
            <X size={18} strokeWidth={2.3} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-axis-border bg-axis-bg px-5 py-4">{footer}</div> : null}
        </section>
      </div>
    </div>,
    document.body
  );
}
