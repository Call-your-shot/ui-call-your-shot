import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Accent = "none" | "primary" | "secondary" | "accent" | "success" | "warning" | "error";

export default function Card({
  className,
  children,
  accent: _accent = "none",
  ...rest
}: HTMLAttributes<HTMLDivElement> & { accent?: Accent }) {
  void _accent;
  return (
    <div
      className={cn(
        "rounded-2xl bg-surface p-6 shadow-card shadow-card-hover",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
