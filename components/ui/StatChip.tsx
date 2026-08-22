import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export default function StatChip({
  icon,
  label,
  tone = "neutral",
}: {
  icon?: ReactNode;
  label: ReactNode;
  tone?: "neutral" | "accent" | "secondary" | "primary";
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-surface-sunken text-ink",
    accent: "bg-accent-light text-accent",
    secondary: "bg-secondary-light text-secondary",
    primary: "bg-primary-light/10 text-primary",
  };

  return (
    <span
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2.5 text-center text-[13px] font-bold",
        toneClasses[tone]
      )}
    >
      {icon}
      {label}
    </span>
  );
}
