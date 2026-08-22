import { cn } from "@/lib/utils";

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex rounded-lg border border-line bg-surface-alt p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "min-h-9 rounded-md px-3 text-[13px] font-semibold transition-colors duration-200",
              active ? "bg-surface text-ink shadow-sm" : "text-muted"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
