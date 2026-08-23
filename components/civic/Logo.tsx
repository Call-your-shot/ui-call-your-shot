// public/logo.png is 1536x1024 — a fixed width is computed from this
// instead of `width: "auto"` because a flex-column parent with the default
// `align-items: stretch` (e.g. every (public) page's own root wrapper)
// stretches an "auto"-width flex child to fill the cross axis, squashing
// the logo. An explicit width is immune to that regardless of the parent's
// flex/grid setup.
const LOGO_ASPECT_RATIO = 1536 / 1024;

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="CYS Solar"
      style={{ height: size, width: size * LOGO_ASPECT_RATIO, flexShrink: 0 }}
    />
  );
}
