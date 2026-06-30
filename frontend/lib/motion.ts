import type { Transition } from "framer-motion";

interface MotionPreset {
  initial: Record<string, number>;
  animate: Record<string, number>;
  exit?: Record<string, number>;
  transition?: Transition;
}

const NO_MOTION: MotionPreset = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
};

export function fadeUp(shouldReduceMotion: boolean): MotionPreset {
  if (shouldReduceMotion) return NO_MOTION;
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.2, ease: "easeOut" },
  };
}

export function fadeScale(shouldReduceMotion: boolean): MotionPreset {
  if (shouldReduceMotion) return NO_MOTION;
  return {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.15, ease: "easeOut" },
  };
}

export function slideX(shouldReduceMotion: boolean, fromX = 24): MotionPreset {
  if (shouldReduceMotion) return NO_MOTION;
  return {
    initial: { opacity: 0, x: fromX },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: fromX },
    transition: { duration: 0.2, ease: "easeOut" },
  };
}
