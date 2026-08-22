import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "info" | "success" | "warning" | "critical";

const variantConfig: Record<
  Variant,
  { bg: string; text: string; Icon: typeof Info }
> = {
  info: {
    bg: "bg-info-light",
    text: "text-info",
    Icon: Info,
  },
  success: {
    bg: "bg-success-light",
    text: "text-success",
    Icon: CheckCircle2,
  },
  warning: {
    bg: "bg-warning-light",
    text: "text-warning",
    Icon: AlertTriangle,
  },
  critical: {
    bg: "bg-error-light",
    text: "text-error",
    Icon: OctagonAlert,
  },
};

export default function Callout({
  variant = "info",
  heading,
  children,
  className,
}: {
  variant?: Variant;
  heading?: string;
  children: ReactNode;
  className?: string;
}) {
  const { bg, text, Icon } = variantConfig[variant];
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl p-4", bg, className)}>
      <Icon size={20} className={cn("mt-0.5 shrink-0", text)} aria-hidden="true" />
      <div className="min-w-0">
        {heading && <p className={cn("text-h3 mb-1", text)}>{heading}</p>}
        <div className="text-body text-grey-800">{children}</div>
      </div>
    </div>
  );
}
