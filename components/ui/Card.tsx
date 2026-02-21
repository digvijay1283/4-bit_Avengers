import { cn } from "@/lib/utils";
import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient";
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl shadow-sm",
          variant === "default" &&
            "bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700",
          variant === "glass" && "glass-card",
          variant === "gradient" &&
            "bg-gradient-to-br from-primary to-green-800 text-white shadow-md",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;
