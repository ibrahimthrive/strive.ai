"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-gradient-primary text-white hover:shadow-glow",
  secondary:
    "border border-white/10 text-ink-secondary hover:border-electric-blue/40 hover:bg-graphite/60 hover:text-ink-primary",
  ghost: "text-ink-muted hover:bg-graphite/60 hover:text-ink-primary",
  danger: "border border-white/10 text-ink-muted hover:border-danger/40 hover:bg-graphite/60 hover:text-ink-secondary",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition active:scale-[0.97] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className ?? ""}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
