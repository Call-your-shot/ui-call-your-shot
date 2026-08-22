const palettes = [
  { sky: "#DCEBF2", hill: "#B8D4C9", wall: "#F4EDE1", roof: "#7A3B2E", trim: "#003C64" },
  { sky: "#E3EEF5", hill: "#C7DCCE", wall: "#EDE3D3", roof: "#5C4A3A", trim: "#007A78" },
  { sky: "#DDEAF4", hill: "#BFDAC6", wall: "#E8D9C4", roof: "#8B4A3C", trim: "#003C64" },
  { sky: "#E6EFF6", hill: "#C2D9C9", wall: "#F0E6D6", roof: "#4A5C4A", trim: "#0F5C8C" },
  { sky: "#DFEBF3", hill: "#BFD8CB", wall: "#E3D6C0", roof: "#6B3F35", trim: "#007A78" },
  { sky: "#E4EFF6", hill: "#C5DBCE", wall: "#EEE2CE", roof: "#5A4638", trim: "#003C64" },
];

export default function HouseIllustration({
  variant,
  className,
}: {
  variant: number;
  className?: string;
}) {
  const p = palettes[variant % palettes.length];

  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Illustration of a house with rooftop solar panels"
    >
      <rect width="320" height="180" fill={p.sky} />
      <circle cx="272" cy="34" r="18" fill="#E8A317" opacity="0.9" />
      <path d="M0 140C50 120 90 132 140 122C190 112 240 128 320 116V180H0Z" fill={p.hill} />

      {/* House body */}
      <rect x="70" y="98" width="150" height="60" fill={p.wall} />
      <polygon points="60,98 145,52 230,98" fill={p.roof} />

      {/* Solar panels on roof */}
      <g opacity="0.92">
        <polygon points="88,94 140,64 152,68 100,98" fill="#0F2942" />
        <polygon points="103,94 148,68 158,71 113,98" fill="#1B3A5C" opacity="0" />
        <polygon points="92,92 136,66 144,69 100,95" fill="#173A5E" />
        <polygon points="102,92 146,66 154,69 110,95" fill="#1F4870" />
        <polygon points="112,92 156,66 164,69 120,95" fill="#173A5E" />
      </g>

      {/* Door + windows */}
      <rect x="132" y="122" width="20" height="36" fill={p.trim} />
      <rect x="86" y="112" width="18" height="18" fill="#FFFFFF" opacity="0.85" />
      <rect x="186" y="112" width="18" height="18" fill="#FFFFFF" opacity="0.85" />

      {/* Ground */}
      <rect x="0" y="158" width="320" height="22" fill="#A9C9AE" />
    </svg>
  );
}
