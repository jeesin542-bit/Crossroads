"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number; // 0-100
  barClassName?: string;
  trackClassName?: string;
  heightClassName?: string;
}

/** A score bar that animates from 0 to `value` on mount. */
export default function ScoreBar({
  value,
  barClassName = "bg-accent",
  trackClassName = "bg-stone-200",
  heightClassName = "h-2.5",
}: Props) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setWidth(Math.max(0, Math.min(100, value))));
    });
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className={`${heightClassName} w-full overflow-hidden rounded-full ${trackClassName}`}>
      <div
        className={`${heightClassName} rounded-full transition-[width] duration-1000 ease-out ${barClassName}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
