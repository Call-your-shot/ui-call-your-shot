"use client";

import { useEffect, useState } from "react";

export default function ProgressRing({
  percent,
  size = 160,
  strokeWidth = 12,
  colorClassName = "stroke-primary",
  trackClassName = "stroke-grey-300",
  children,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  colorClassName?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}) {
  const [animated, setAnimated] = useState(0);
  // Lazy-initialized so this reads the media query on the very first client
  // render instead of via a post-mount effect; guarded for SSR where
  // `window` doesn't exist. Doesn't affect the initial DOM output (the ring
  // always starts at 0), so it can't cause a hydration mismatch.
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (reduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimated(percent);
      return;
    }
    const t = setTimeout(() => setAnimated(percent), 100);
    return () => clearTimeout(t);
  }, [percent, reduceMotion]);

  const offset = circumference - (animated / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorClassName}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
