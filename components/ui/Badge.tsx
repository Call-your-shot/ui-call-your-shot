import { cn } from "@/lib/utils";
import type { PlanStatus } from "@/lib/mockData";

const statusConfig: Record<PlanStatus, { label: string; classes: string }> = {
  active: { label: "Active", classes: "bg-success-light text-success" },
  pending: { label: "Awaiting landlord", classes: "bg-warning-light text-warning" },
  declined: { label: "Declined", classes: "bg-grey-200 text-grey-600" },
};

export default function StatusBadge({ status }: { status: PlanStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 text-[12px] font-bold",
        cfg.classes
      )}
    >
      {cfg.label}
    </span>
  );
}
