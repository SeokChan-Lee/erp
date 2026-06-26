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
          <path
            d="M18 44L46 20"
            fill="none"
            stroke={inverted ? "#0071e3" : "#9ec5ff"}
            strokeLinecap="round"
            strokeWidth="7"
          />
          <circle cx="18" cy="44" r="6" fill="currentColor" />
          <circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.72" />
          <circle cx="46" cy="20" r="6" fill="currentColor" />
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
