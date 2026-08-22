import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export default function StatBlock({
  label,
  value,
  caption,
  valueClassName,
  align = "left",
}: {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
  valueClassName?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : "text-left"}>
      <p className="text-[14px] font-semibold text-grey-600">{label}</p>
      <p className={cn("text-data mt-1", valueClassName)}>{value}</p>
      {caption && <p className="text-small mt-0.5">{caption}</p>}
    </div>
  );
}
