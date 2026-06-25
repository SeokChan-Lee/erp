import { forwardRef, type InputHTMLAttributes, type ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  type?: "text" | "email" | "number" | "password";
  error?: string;
  leftIcon?: ReactNode;
  onEnter?: () => void;
  containerClassName?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    type = "text",
    error,
    leftIcon,
    onEnter,
    containerClassName = "",
    className = "",
    onKeyDown,
    ...props
  },
  ref
) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const password = type === "password";
  const inputType = password && passwordVisible ? "text" : type;
  const hasRightAction = password;

  return (
    <label className={["block", containerClassName].join(" ")}>
      <span className="text-sm font-semibold text-axis-ink">{label}</span>
      <span className="relative mt-2 block">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-axis-muted">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={[
            "axis-field",
            leftIcon ? "pl-9" : "",
            hasRightAction ? "pr-10" : "",
            className
          ].join(" ")}
          type={inputType}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!event.defaultPrevented && event.key === "Enter") {
              onEnter?.();
            }
          }}
          {...props}
        />
        {password ? (
          <button
            aria-label={passwordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-axis-muted transition hover:bg-axis-bg hover:text-axis-ink"
            type="button"
            onClick={() => setPasswordVisible((current) => !current)}
          >
            {passwordVisible ? <EyeOff size={17} strokeWidth={2.2} /> : <Eye size={17} strokeWidth={2.2} />}
          </button>
        ) : null}
      </span>
      {error ? <span className="mt-1 block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
});
