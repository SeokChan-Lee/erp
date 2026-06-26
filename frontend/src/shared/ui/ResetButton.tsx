import { RotateCcw } from "lucide-react";

import { Button } from "./Button";

type ResetButtonProps = {
  onClick: () => void;
  className?: string;
  label?: string;
};

export function ResetButton({ onClick, className = "", label = "초기화" }: ResetButtonProps) {
  return (
    <Button
      className={[
        "h-11 gap-2 border-axis-ink bg-axis-ink px-4 text-white hover:bg-black",
        className
      ].join(" ")}
      type="button"
      variant="secondary"
      onClick={onClick}
    >
      <RotateCcw size={16} strokeWidth={2.3} />
      {label}
    </Button>
  );
}
