"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { Modal } from "@/components/ui/Modal";
import { STORAGE_KEYS } from "@/lib/storage";
import { tierBadgeTone, tierLabel } from "@/lib/tier";
import type { StoredUser } from "@/types/chat";

export function GeneralSection({ user }: { user: StoredUser | null }) {
  const [confirmReset, setConfirmReset] = useState(false);

  function handleReset() {
    setConfirmReset(false);
    window.localStorage.removeItem(STORAGE_KEYS.conversations);
    window.location.href = "/";
  }

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">General</h2>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-secondary">{user?.email ?? "—"}</p>
          <Badge tone={tierBadgeTone(user?.tier)}>{tierLabel(user?.tier)} plan</Badge>
        </div>
        <div className="flex gap-2">
          <Link href="/profile">
            <Button variant="secondary" size="sm">
              Edit profile
            </Button>
          </Link>
          <Link href="/billing/manage">
            <Button variant="secondary" size="sm">
              Manage billing
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 border-t border-white/5 pt-5">
        <p className="text-sm text-ink-secondary">Reset local chat list</p>
        <p className="mt-1 text-xs text-ink-disabled">
          Clears the conversation list shown in this browser&apos;s sidebar. Your account&apos;s actual conversation
          history on the History page is not affected.
        </p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
          Reset local chat list
        </Button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset local chat list?">
        <p className="mb-5 text-sm text-ink-muted">
          This clears the chat list in this browser only. It won&apos;t delete anything from your account&apos;s
          History.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </Modal>
    </FadeInSection>
  );
}
