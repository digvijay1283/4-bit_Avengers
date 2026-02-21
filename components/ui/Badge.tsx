import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  success: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
};

export default function Badge({
  variant = "default",
  children,
  className,
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
        variantClasses[variant],
        pulse && "animate-pulse",
        className
      )}
    >
      {children}
    </span>
  );
}
