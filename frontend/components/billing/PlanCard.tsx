"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Building2, Check, Rocket, Sparkles, type LucideIcon } from "lucide-react";

import { fadeUp } from "@/lib/motion";
import type { PlanOut, PlanTier } from "@/types/billing";

const PLAN_ICON: Record<PlanTier, LucideIcon> = {
  free: Sparkles,
  pro: Rocket,
  business: Building2,
};

const PLAN_COPY: Record<PlanTier, { name: string; tagline: string }> = {
  free: { name: "Free", tagline: "Get a feel for Strive" },
  pro: { name: "Pro", tagline: "For everyday power users" },
  business: { name: "Business", tagline: "For teams that depend on Strive" },
};

function featuresFor(plan: PlanOut): string[] {
  switch (plan.tier) {
    case "free":
      return [
        "Unlimited messages",
        plan.upload_limit_per_day !== null ? `${plan.upload_limit_per_day} uploads per day` : "Limited uploads",
        "gpt-4o-mini model",
        "Conversation history & folders",
        "Community support",
      ];
    case "pro":
      return ["Unlimited messages", "Unlimited uploads", "gpt-4o model", "Conversation history & folders", "Priority support"];
    case "business":
      return ["Everything in Pro", "Business invoicing & receipts", "Priority support queue", "Dedicated account email"];
  }
}

function formatPrice(plan: PlanOut): string {
  if (plan.unit_amount === null || plan.unit_amount === 0) return "$0";
  const amount = plan.unit_amount / 100;
  return `$${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

interface PlanCardProps {
  plan: PlanOut;
  isCurrent: boolean;
  popular?: boolean;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onSelect: () => void;
  delay?: number;
}

export function PlanCard({ plan, isCurrent, popular, ctaLabel, ctaDisabled, ctaLoading, onSelect, delay = 0 }: PlanCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));
  const copy = PLAN_COPY[plan.tier];
  const Icon = PLAN_ICON[plan.tier];

  return (
    <motion.div
      initial={preset.initial}
      animate={preset.animate}
      transition={{ ...preset.transition, delay }}
      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
      className={`relative rounded-2xl p-[1px] transition ${
        popular ? "bg-gradient-ai shadow-glow" : "bg-white/10"
      }`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-ai px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-glow">
          Most popular
        </span>
      )}

      <div className="flex h-full flex-col gap-5 rounded-2xl bg-midnight-navy/95 p-6">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white">
            <Icon size={16} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-primary">{copy.name}</p>
            <p className="text-[11px] text-ink-disabled">{copy.tagline}</p>
          </div>
        </div>

        {plan.available ? (
          <p className="text-3xl font-semibold text-ink-primary">
            {formatPrice(plan)}
            <span className="text-sm font-normal text-ink-muted">/{plan.interval ?? "mo"}</span>
          </p>
        ) : (
          <p className="text-lg font-medium text-ink-disabled">Coming soon</p>
        )}

        <ul className="flex-1 space-y-2.5">
          {featuresFor(plan).map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-ink-secondary">
              <Check size={14} className="mt-0.5 shrink-0 text-neural-cyan" />
              {feature}
            </li>
          ))}
        </ul>

        <motion.button
          type="button"
          onClick={onSelect}
          disabled={ctaDisabled || !plan.available}
          whileHover={ctaDisabled || shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={ctaDisabled || shouldReduceMotion ? undefined : { scale: 0.98 }}
          className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed ${
            isCurrent
              ? "border border-white/10 text-ink-disabled"
              : "bg-gradient-primary text-white hover:shadow-glow disabled:opacity-40"
          }`}
        >
          {ctaLoading ? "Redirecting..." : ctaLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
