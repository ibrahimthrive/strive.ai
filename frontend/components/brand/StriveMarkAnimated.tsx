"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

import StriveMark from "@/components/brand/StriveMark";

interface StriveMarkAnimatedProps {
  size?: number;
  loop?: boolean;
}

const NODES = [
  { cx: 8, cy: 26, r: 2.75, delay: 0 },
  { cx: 22, cy: 20, r: 2.25, delay: 0.15 },
  { cx: 10, cy: 14, r: 2.25, delay: 0.3 },
  { cx: 24, cy: 6, r: 2.75, delay: 0.45 },
];

export default function StriveMarkAnimated({ size = 32, loop = true }: StriveMarkAnimatedProps) {
  const gradientId = useId();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <StriveMark size={size} />;
  }

  const repeat = loop ? Infinity : 0;

  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" role="img" aria-label="Strive">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="32" x2="32" y2="0">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <motion.path
        d="M8 26 L22 20 L10 14 L24 6"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut", repeat, repeatDelay: 0.4 }}
      />
      {NODES.map((node) => (
        <motion.circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill={`url(#${gradientId})`}
          initial={{ scale: 0.6, opacity: 0.5 }}
          animate={{ scale: [0.6, 1, 0.6], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat, delay: node.delay }}
          style={{ originX: `${node.cx}px`, originY: `${node.cy}px` }}
        />
      ))}
    </svg>
  );
}
