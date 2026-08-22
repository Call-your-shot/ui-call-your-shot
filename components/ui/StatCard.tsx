import Card from "./Card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

type Tone = "success" | "info" | "warning" | "primary";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-light text-success",
  info: "bg-info-light text-info",
  warning: "bg-warning-light text-warning",
  primary: "bg-primary-lighter text-primary-darker",
};

export default function StatCard({
  icon: Icon,
  tone = "primary",
  value,
  label,
  trend,
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  value: React.ReactNode;
  label: string;
  trend?: { value: number; label?: string };
  className?: string;
}) {
  const trendPositive = trend ? trend.value >= 0 : null;

  return (
    <Card className={className}>
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          toneClasses[tone]
        )}
      >
        <Icon size={22} aria-hidden="true" />
      </span>
      <p className="text-data mt-4">{value}</p>
      <p className="text-[14px] font-semibold text-grey-600">{label}</p>

      {trend && (
        <div
          className={cn(
            "mt-3 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-bold",
            trendPositive ? "bg-success-light text-success" : "bg-error-light text-error"
          )}
        >
          {trendPositive ? (
            <TrendingUp size={13} aria-hidden="true" />
          ) : (
            <TrendingDown size={13} aria-hidden="true" />
          )}
          {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
        </div>
      )}
    </Card>
  );
}
