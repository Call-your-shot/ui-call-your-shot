import { cn } from "@/lib/utils";

export default function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div>
      {/* Desktop: numbered horizontal stepper */}
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((label, i) => {
          const isDone = i < current;
          const isCurrent = i === current;
          return (
            <li key={label} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                  isDone && "bg-secondary text-white",
                  isCurrent && "bg-primary text-white",
                  !isDone && !isCurrent && "bg-surface-sunken text-muted"
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-[13px] font-medium",
                  isCurrent ? "text-ink" : "text-muted"
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <span className="mx-1 h-px w-6 bg-line" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile: "Step X of Y" + thin progress bar */}
      <div className="sm:hidden">
        <p className="text-[13px] font-semibold text-muted">
          Step {current + 1} of {steps.length} — {steps[current]}
        </p>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
