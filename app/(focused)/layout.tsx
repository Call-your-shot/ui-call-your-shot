import FocusedHeader from "@/components/focused-shell/FocusedHeader";

export default function FocusedShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-alt">
      <FocusedHeader />
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-5 sm:px-6">
        {children}
      </div>
    </div>
  );
}
