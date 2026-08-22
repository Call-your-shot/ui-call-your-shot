import type { ReactNode } from "react";

export default function BottomCTA({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 mt-auto border-t border-line bg-surface/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur sm:px-6">
      <div className="mx-auto w-full max-w-2xl">{children}</div>
    </div>
  );
}
