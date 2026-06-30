"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageSquare } from "lucide-react";

import { relativeTime } from "@/lib/format";
import { fadeUp } from "@/lib/motion";
import type { ActivityItem } from "@/types/dashboard";

export function ActivityTimeline({ activity }: { activity: ActivityItem[] }) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">Activity</p>
      {activity.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-disabled">No activity yet.</p>
      ) : (
        <ol className="scroll-thin max-h-72 space-y-3 overflow-y-auto pr-1">
          {activity.map((item, index) => (
            <motion.li
              key={`${item.created_at}-${index}`}
              initial={preset.initial}
              animate={preset.animate}
              transition={{ ...preset.transition, delay: index * 0.03 }}
              className="flex gap-3"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-graphite text-ink-disabled">
                <MessageSquare size={12} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink-secondary">{item.preview}</span>
                <span className="block text-[11px] text-ink-disabled">
                  in &quot;{item.conversation_title}&quot; &middot; {relativeTime(item.created_at)}
                </span>
              </span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
