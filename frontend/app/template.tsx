"use client";

import { motion, useReducedMotion } from "framer-motion";

import { fadeUp } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  return (
    <motion.div initial={preset.initial} animate={preset.animate} transition={preset.transition} className="h-full">
      {children}
    </motion.div>
  );
}
