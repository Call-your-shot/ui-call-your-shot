import Logo from "./Logo";

interface FooterColumn {
  title: string;
  items: string[];
}

const columns: FooterColumn[] = [
  {
    title: "Contact",
    items: ["1300 786 465", "42 Bellambi Lane, Bellambi NSW 2518", "Mon–Fri 8:30am–5pm"],
  },
  {
    title: "About",
    items: ["How it works", "Fairness rules", "Frequently asked questions"],
  },
  {
    title: "Resources",
    items: ["Energy rebates", "NSW energy programs", "Australian Energy Regulator"],
  },
  {
    title: "Legal",
    items: ["Privacy", "Terms of use", "Accessibility statement"],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-auto">
      <div className="border-y border-line bg-surface-alt py-8">
        <p className="mx-auto max-w-2xl px-6 text-center text-small text-muted">
          We acknowledge the Traditional Custodians of Dharawal Country, Elders
          past and present.
        </p>
      </div>

      <div className="bg-primary-dark text-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8 flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-[17px] font-bold text-white">CYS Solar</span>
          </div>

          {/* Desktop: four columns */}
          <div className="hidden grid-cols-4 gap-8 sm:grid">
            {columns.map((col) => (
              <div key={col.title}>
                <h2 className="text-[13px] font-semibold tracking-wide text-white/60 uppercase">
                  {col.title}
                </h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {col.items.map((item) => (
                    <li key={item} className="text-small text-white/85">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile: stacked accordion */}
          <div className="flex flex-col divide-y divide-white/15 sm:hidden">
            {columns.map((col) => (
              <details key={col.title} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold text-white">
                  {col.title}
                  <span
                    aria-hidden="true"
                    className="text-lg transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <ul className="mt-3 flex flex-col gap-2 pb-1">
                  {col.items.map((item) => (
                    <li key={item} className="text-small text-white/85">
                      {item}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>

        <div className="border-t border-white/15">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
            <p className="text-[12px] text-white/60">
              © 2026 · A concept prototype — not affiliated with or endorsed by
              Wollongong City Council.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
