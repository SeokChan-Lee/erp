type AxisLogoProps = {
  compact?: boolean;
  inverted?: boolean;
  markOnly?: boolean;
};

export function AxisLogo({ compact = false, inverted = false, markOnly = false }: AxisLogoProps) {
  const markSize = compact ? "h-10 w-10" : "h-14 w-14";
  const titleSize = compact ? "text-lg" : "text-2xl";
  const subtitleSize = compact ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center gap-3">
      <span
        className={[
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border",
          markSize,
          inverted ? "border-white/16 bg-white text-axis-ink" : "border-axis-border bg-axis-ink text-white"
        ].join(" ")}
      >
        <svg className={compact ? "h-7 w-7" : "h-9 w-9"} viewBox="0 0 64 64" aria-hidden="true">
          <path d="M16 18H48L40 30H16Z" fill="currentColor" opacity={inverted ? "0.92" : "1"} />
          <path d="M24 34H56L48 46H24Z" fill={inverted ? "#0071e3" : "#9ec5ff"} />
          <path d="M16 18L24 34H40L48 18Z" fill={inverted ? "#1d1d1f" : "#ffffff"} opacity={inverted ? "0.14" : "0.22"} />
        </svg>
      </span>
      {markOnly ? null : (
        <div>
          <p className={[titleSize, "font-semibold tracking-normal", inverted ? "text-white" : "text-axis-ink"].join(" ")}>
            Axis ERP
          </p>
          <p className={[subtitleSize, "mt-1 font-medium", inverted ? "text-white/55" : "text-axis-muted"].join(" ")}>
            운영 관리 플랫폼
          </p>
        </div>
      )}
    </div>
  );
}
