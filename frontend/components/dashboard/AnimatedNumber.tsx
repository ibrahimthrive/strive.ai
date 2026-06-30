"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  format?: (value: number) => string;
}

export function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  const previousValue = useRef(0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplay(value);
      previousValue.current = value;
      return;
    }

    const controls = animate(previousValue.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: setDisplay,
    });
    previousValue.current = value;
    return () => controls.stop();
  }, [value, shouldReduceMotion]);

  const rounded = Math.round(display);
  return <span>{format ? format(rounded) : rounded.toLocaleString()}</span>;
}
