"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";

interface DangerZoneSectionProps {
  onDeleteAccount: (password: string) => Promise<void>;
}

export function DangerZoneSection({ onDeleteAccount }: DangerZoneSectionProps) {
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!password) return;
    setDeleting(true);
    try {
      await onDeleteAccount(password);
    } catch (err) {
      push(err instanceof Error ? err.message : "Couldn't delete your account.", "error");
      setDeleting(false);
    }
  }

  return (
    <FadeInSection id="danger-zone" className="glass-panel rounded-2xl border border-danger/20 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-danger">
        <AlertTriangle size={14} /> Danger Zone
      </h2>
      <p className="mt-1 text-xs text-ink-disabled">
        Deleting your account permanently removes your conversations, history, and billing records. This
        can&apos;t be undone.
      </p>
      <Button variant="danger" size="sm" className="mt-4" onClick={() => setOpen(true)}>
        Delete account
      </Button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setPassword("");
        }}
        title="Delete your account?"
      >
        <p className="mb-3 text-sm text-ink-muted">
          Enter your password to confirm. This will permanently delete your account and all of its data.
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-danger/40 focus:outline-none"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" disabled={!password || deleting} onClick={() => void handleDelete()}>
            {deleting ? "Deleting..." : "Delete account"}
          </Button>
        </div>
      </Modal>
    </FadeInSection>
  );
}
