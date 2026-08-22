export default function UtilityBar() {
  return (
    <div className="hidden bg-primary-dark text-white sm:block">
      <div className="mx-auto flex h-9 w-full max-w-6xl items-center justify-end gap-6 px-6 text-[13px]">
        <button type="button" className="hover:underline">
          Accessibility
        </button>
        <button type="button" className="hover:underline">
          Translate
        </button>
        <button type="button" className="hover:underline">
          Help
        </button>
      </div>
    </div>
  );
}
