"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, createShareLink, revokeShareLink } from "@/lib/api";
import { STORAGE_KEYS } from "@/lib/storage";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

export function ShareModal({ open, onClose, clientId }: ShareModalProps) {
  const { push } = useToast();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    setLoading(true);
    try {
      const { share_token } = await createShareLink(accessToken, clientId);
      setShareUrl(`${window.location.origin}/share/${share_token}`);
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't create a share link.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    try {
      await revokeShareLink(accessToken, clientId);
      setShareUrl(null);
      push("Stopped sharing this conversation.", "success");
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't stop sharing.", "error");
    }
  }

  function copyLink() {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
    push("Link copied.", "success");
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setShareUrl(null);
      }}
      title="Share conversation"
    >
      <p className="mb-3 text-sm text-ink-muted">
        Anyone with this link can view a read-only copy of this conversation. They won&apos;t need an account.
      </p>
      {shareUrl ? (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-deep-space/60 px-3 py-2">
          <code className="flex-1 truncate text-xs text-ink-secondary">{shareUrl}</code>
          <button
            onClick={copyLink}
            aria-label="Copy share link"
            className="rounded-md p-1 text-ink-disabled hover:text-ink-secondary"
          >
            <Copy size={14} />
          </button>
        </div>
      ) : (
        <Button variant="primary" size="sm" disabled={loading} onClick={() => void handleCreate()}>
          {loading ? "Creating link..." : "Create share link"}
        </Button>
      )}
      <div className="mt-5 flex justify-end gap-2">
        {shareUrl && (
          <Button variant="danger" size="sm" onClick={() => void handleRevoke()}>
            Stop sharing
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
