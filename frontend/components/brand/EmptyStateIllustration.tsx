"use client";

import { useId } from "react";

const NODES = [
  [20, 40],
  [60, 20],
  [100, 55],
  [140, 25],
  [180, 50],
  [210, 90],
  [170, 110],
  [120, 130],
  [70, 120],
  [35, 90],
] as const;

const EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 0],
  [2, 8],
  [3, 6],
];

interface EmptyStateIllustrationProps {
  className?: string;
}

export default function EmptyStateIllustration({ className }: EmptyStateIllustrationProps) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 230 150"
      width={230}
      height={150}
      fill="none"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="150" x2="230" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {EDGES.map(([a, b]) => {
        const from = NODES[a];
        const to = NODES[b];
        if (!from || !to) return null;
        return (
          <line
            key={`${a}-${b}`}
            x1={from[0]}
            y1={from[1]}
            x2={to[0]}
            y2={to[1]}
            stroke="white"
            strokeOpacity={0.08}
            strokeWidth={1}
          />
        );
      })}
      {NODES.map(([cx, cy], index) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={index % 3 === 0 ? 3.5 : 2.5} fill={`url(#${gradientId})`} opacity={0.5} />
      ))}
    </svg>
  );
}
