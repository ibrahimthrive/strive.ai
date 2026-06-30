"use client";

import { useId } from "react";

interface StriveMarkProps {
  size?: number;
  className?: string;
}

/**
 * Abstract node-and-edge "S": four gradient nodes connected by angular
 * strokes tracing bottom-left to top-right — neural network + upward motion.
 */
export default function StriveMark({ size = 32, className }: StriveMarkProps) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Strive"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="32" x2="32" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path
        d="M8 26 L22 20 L10 14 L24 6"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="26" r="2.75" fill={`url(#${gradientId})`} />
      <circle cx="22" cy="20" r="2.25" fill={`url(#${gradientId})`} />
      <circle cx="10" cy="14" r="2.25" fill={`url(#${gradientId})`} />
      <circle cx="24" cy="6" r="2.75" fill={`url(#${gradientId})`} />
    </svg>
  );
}
