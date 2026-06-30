"use client";

import { useState } from "react";
import { Copy, Key, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { relativeTime } from "@/lib/format";
import type { ApiKeyCreateResponse, ApiKeyOut } from "@/types/profile";

interface ApiKeysSectionProps {
  apiKeys: ApiKeyOut[];
  onCreate: (name: string) => Promise<ApiKeyCreateResponse>;
  onRevoke: (id: string) => Promise<void>;
}

export function ApiKeysSection({ apiKeys, onCreate, onRevoke }: ApiKeysSectionProps) {
  const { push } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreateResponse | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  async function handleCreate() {
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmed);
      setCreateOpen(false);
      setNameDraft("");
      setRevealedKey(created);
    } catch {
      push("Couldn't create the API key. Please try again.", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke() {
    if (!revokeId) return;
    const id = revokeId;
    setRevokeId(null);
    try {
      await onRevoke(id);
    } catch {
      push("Couldn't revoke that key. Please try again.", "error");
    }
  }

  function copyKey() {
    if (!revealedKey) return;
    void navigator.clipboard.writeText(revealedKey.api_key);
    push("Copied to clipboard.", "success");
  }

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink-primary">API Keys</h2>
          <p className="mt-1 text-xs text-ink-disabled">
            Keys are saved for your records. API key authentication for requests is coming soon.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Generate key
        </Button>
      </div>

      {apiKeys.length === 0 ? (
        <p className="mt-4 text-sm text-ink-disabled">No API keys yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {apiKeys.map((key) => (
            <li key={key.id} className="flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2.5">
              <Key size={14} className="shrink-0 text-ink-disabled" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink-primary">{key.name}</p>
                <p className="text-[11px] text-ink-disabled">
                  {key.key_prefix}&hellip; &middot; Created {relativeTime(key.created_at)}
                  {key.revoked_at && " · Revoked"}
                </p>
              </div>
              {!key.revoked_at && (
                <button
                  onClick={() => setRevokeId(key.id)}
                  aria-label="Revoke key"
                  className="rounded-md p-1.5 text-ink-disabled transition hover:bg-graphite hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Generate API key">
        <p className="mb-3 text-sm text-ink-muted">Give this key a name so you can recognize it later.</p>
        <input
          autoFocus
          value={nameDraft}
          onChange={(event) => setNameDraft(event.target.value)}
          placeholder="e.g. Local development"
          className="w-full rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={!nameDraft.trim() || creating} onClick={() => void handleCreate()}>
            {creating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </Modal>

      <Modal open={revealedKey !== null} onClose={() => setRevealedKey(null)} title="Your new API key">
        <p className="mb-3 text-sm text-ink-muted">
          Copy this now — for your security, it won&apos;t be shown again.
        </p>
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-deep-space/60 px-3 py-2">
          <code className="flex-1 truncate text-xs text-ink-secondary">{revealedKey?.api_key}</code>
          <button onClick={copyKey} aria-label="Copy API key" className="rounded-md p-1 text-ink-disabled hover:text-ink-secondary">
            <Copy size={14} />
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setRevealedKey(null)}>
            Done
          </Button>
        </div>
      </Modal>

      <Modal open={revokeId !== null} onClose={() => setRevokeId(null)} title="Revoke this key?">
        <p className="mb-5 text-sm text-ink-muted">Anything using this key will stop working immediately.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setRevokeId(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={() => void handleRevoke()}>
            Revoke
          </Button>
        </div>
      </Modal>
    </FadeInSection>
  );
}
