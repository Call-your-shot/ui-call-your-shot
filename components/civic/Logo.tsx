export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="16" cy="12" r="5.5" fill="#E8A317" />
      <path d="M3 27L13 15L19 21L24 15L29 27H3Z" fill="#003C64" />
    </svg>
  );
}
