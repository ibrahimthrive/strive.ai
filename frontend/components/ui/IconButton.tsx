"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "ghost" | "secondary" | "primary";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  "aria-label": string;
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  ghost: "text-ink-muted hover:bg-graphite/60 hover:text-ink-primary",
  secondary: "border border-white/10 text-ink-secondary hover:border-electric-blue/40 hover:bg-graphite/60",
  primary: "bg-gradient-primary text-white hover:shadow-glow",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition active:scale-[0.93] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className ?? ""}`}
        {...props}
      />
    );
  }
);

IconButton.displayName = "IconButton";
