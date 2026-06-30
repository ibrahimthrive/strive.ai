"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Badge } from "@/components/ui/Badge";
import { fadeUp } from "@/lib/motion";
import { tierBadgeTone, tierLabel } from "@/lib/tier";
import type { StoredUser } from "@/types/chat";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function WelcomeSection({ user }: { user: StoredUser | null }) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  return (
    <motion.div
      initial={preset.initial}
      animate={preset.animate}
      transition={preset.transition}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">
          {greeting()}
          {user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h1>
        <p className="text-sm text-ink-muted">Here&apos;s what&apos;s happening with your account.</p>
      </div>
      <Badge tone={tierBadgeTone(user?.tier)}>{tierLabel(user?.tier)} plan</Badge>
    </motion.div>
  );
}
