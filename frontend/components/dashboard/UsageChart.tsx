"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { SeriesPoint } from "@/types/dashboard";

interface UsageChartProps {
  title: string;
  data: SeriesPoint[];
  accent?: string;
}

export function UsageChart({ title, data, accent = "bg-gradient-primary" }: UsageChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const max = Math.max(1, ...data.map((point) => point.value));

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-muted">{title}</p>
      <div className="flex h-24 items-end gap-2">
        {data.map((point, index) => {
          const heightPct = Math.max((point.value / max) * 100, point.value > 0 ? 6 : 0);
          return (
            <div key={point.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              <div className="flex h-full w-full items-end overflow-hidden rounded-md bg-graphite/40">
                <motion.div
                  initial={shouldReduceMotion ? false : { height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: shouldReduceMotion ? 0 : index * 0.04 }}
                  className={`w-full rounded-md ${accent}`}
                />
              </div>
              <span className="text-[10px] text-ink-disabled">{point.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
