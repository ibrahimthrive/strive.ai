"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { fadeScale } from "@/lib/motion";

interface TooltipProps {
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom";
}

export function Tooltip({ label, children, side = "top" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeScale(Boolean(shouldReduceMotion));

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={preset.initial}
            animate={preset.animate}
            exit={preset.exit}
            transition={preset.transition}
            className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-midnight-navy px-2 py-1 text-[11px] text-ink-secondary shadow-lg ${
              side === "top" ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
