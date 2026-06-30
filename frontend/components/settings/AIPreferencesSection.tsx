"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";

interface AIPreferencesSectionProps {
  customInstructions: string | null;
  onSave: (customInstructions: string) => Promise<void>;
}

export function AIPreferencesSection({ customInstructions, onSave }: AIPreferencesSectionProps) {
  const [draft, setDraft] = useState(customInstructions ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(draft.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">AI Preferences</h2>
      <p className="mt-1 text-xs text-ink-disabled">
        Strive will follow these instructions in every conversation — for example, a preferred tone or things to
        always avoid.
      </p>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="e.g. Keep answers concise and skip the pleasantries."
        className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
      />
      <Button variant="primary" size="sm" className="mt-3" disabled={saving} onClick={() => void handleSave()}>
        {saving ? "Saving..." : "Save instructions"}
      </Button>
    </FadeInSection>
  );
}
