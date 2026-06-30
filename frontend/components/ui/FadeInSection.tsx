"use client";

import { motion, useReducedMotion } from "framer-motion";

import { fadeUp } from "@/lib/motion";

interface FadeInSectionProps {
  className?: string;
  id?: string;
  children: React.ReactNode;
}

export function FadeInSection({ className, id, children }: FadeInSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  return (
    <motion.div
      id={id}
      initial={preset.initial}
      animate={preset.animate}
      transition={preset.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
