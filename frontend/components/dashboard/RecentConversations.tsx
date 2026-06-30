"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";

import { relativeTime } from "@/lib/format";
import { fadeUp } from "@/lib/motion";
import type { ConversationSummary } from "@/types/dashboard";

export function RecentConversations({ conversations }: { conversations: ConversationSummary[] }) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  return (
    <div className="glass-panel rounded-2xl p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">Recent Conversations</p>
      {conversations.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-disabled">
          No conversations yet. Start chatting to see them here.
        </p>
      ) : (
        <ul className="space-y-1">
          {conversations.map((conversation, index) => (
            <motion.li
              key={conversation.client_id}
              initial={preset.initial}
              animate={preset.animate}
              transition={{ ...preset.transition, delay: index * 0.05 }}
            >
              <Link
                href={`/?c=${conversation.client_id}`}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-graphite/60"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <MessageCircle size={14} className="shrink-0 text-ink-disabled" />
                  <span className="truncate text-sm text-ink-secondary">{conversation.title}</span>
                </span>
                <span className="shrink-0 text-[11px] text-ink-disabled">
                  {relativeTime(conversation.updated_at)}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
