"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pencil } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { fadeUp } from "@/lib/motion";
import { tierBadgeTone, tierLabel } from "@/lib/tier";
import type { ProfileOut } from "@/types/profile";

interface ProfileHeaderProps {
  profile: ProfileOut;
  onSaveDisplayName: (displayName: string) => Promise<void>;
}

export function ProfileHeader({ profile, onSaveDisplayName }: ProfileHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(profile.display_name ?? "");
  const [saving, setSaving] = useState(false);

  async function commit() {
    setIsEditing(false);
    const trimmed = draft.trim();
    if (trimmed === (profile.display_name ?? "")) return;
    setSaving(true);
    try {
      await onSaveDisplayName(trimmed);
    } finally {
      setSaving(false);
    }
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <motion.div
      initial={preset.initial}
      animate={preset.animate}
      transition={preset.transition}
      className="glass-panel flex flex-wrap items-center gap-5 rounded-2xl p-6"
    >
      <Avatar variant="user" email={profile.email} size={56} />

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => void commit()}
            onKeyDown={(event) => {
              if (event.key === "Enter") void commit();
              if (event.key === "Escape") {
                setDraft(profile.display_name ?? "");
                setIsEditing(false);
              }
            }}
            placeholder="Add a display name"
            className="w-full max-w-xs rounded-md bg-deep-space/60 px-2 py-1 text-base font-semibold text-ink-primary focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            disabled={saving}
            className="group flex items-center gap-2 text-base font-semibold text-ink-primary"
          >
            {profile.display_name || profile.email.split("@")[0]}
            <Pencil size={13} className="text-ink-disabled opacity-0 transition group-hover:opacity-100" />
          </button>
        )}
        <p className="text-sm text-ink-muted">{profile.email}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-ink-disabled">
        <div>
          <p className="uppercase tracking-wide">Role</p>
          <p className="mt-0.5 text-sm text-ink-secondary">Owner</p>
        </div>
        <div>
          <p className="uppercase tracking-wide">Member since</p>
          <p className="mt-0.5 text-sm text-ink-secondary">{memberSince}</p>
        </div>
        <Badge tone={tierBadgeTone(profile.tier)}>{tierLabel(profile.tier)} plan</Badge>
      </div>
    </motion.div>
  );
}
