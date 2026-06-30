"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { AnimatedNumber } from "@/components/dashboard/AnimatedNumber";
import { fadeUp } from "@/lib/motion";

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: (value: number) => string;
  suffix?: string;
  subLabel?: string;
  comingSoon?: boolean;
  textValue?: string;
  accent?: string;
  delay?: number;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  format,
  suffix,
  subLabel,
  comingSoon,
  textValue,
  accent = "bg-gradient-primary",
  delay = 0,
}: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  return (
    <motion.div
      initial={preset.initial}
      animate={preset.animate}
      transition={{ ...preset.transition, delay }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      className="glass-panel rounded-2xl p-4 transition hover:border-electric-blue/30"
    >
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${accent} text-white`}>
        <Icon size={16} />
      </div>
      <p className="text-xs text-ink-muted">{label}</p>
      {comingSoon ? (
        <p className="mt-1 text-base font-medium text-ink-disabled">Coming soon</p>
      ) : textValue ? (
        <p className="mt-1 text-2xl font-semibold text-ink-primary">{textValue}</p>
      ) : (
        <p className="mt-1 text-2xl font-semibold text-ink-primary">
          <AnimatedNumber value={value} format={format} />
          {suffix && <span className="ml-1 text-sm font-normal text-ink-muted">{suffix}</span>}
        </p>
      )}
      {subLabel && !comingSoon && <p className="mt-1 text-[11px] text-ink-disabled">{subLabel}</p>}
    </motion.div>
  );
}
