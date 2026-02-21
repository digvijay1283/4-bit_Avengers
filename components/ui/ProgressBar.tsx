import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  color = "bg-primary",
  size = "md",
  className,
}: ProgressBarProps) {
  const percent = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs font-semibold mb-1">
          {label && <span>{label}</span>}
          {showPercent && <span className="text-primary">{percent}%</span>}
        </div>
      )}
      <div
        className={cn(
          "w-full bg-gray-100 rounded-full dark:bg-gray-700",
          size === "sm" ? "h-1" : "h-2"
        )}
      >
        <div
          className={cn("rounded-full transition-all duration-500", color, size === "sm" ? "h-1" : "h-2")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
