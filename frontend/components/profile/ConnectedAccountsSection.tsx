"use client";

import { Plug } from "lucide-react";

import { FadeInSection } from "@/components/ui/FadeInSection";
import { useToast } from "@/components/ui/ToastProvider";

const PROVIDERS = ["Google", "GitHub"];

export function ConnectedAccountsSection() {
  const { push } = useToast();

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Connected Accounts</h2>
      <p className="mt-1 text-xs text-ink-disabled">
        Email &amp; password is your only sign-in method right now. Social sign-in is coming soon.
      </p>

      <ul className="mt-4 space-y-2">
        {PROVIDERS.map((provider) => (
          <li key={provider} className="flex items-center justify-between rounded-xl border border-white/5 px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-ink-secondary">
              <Plug size={14} className="text-ink-disabled" />
              {provider}
            </span>
            <button
              onClick={() => push("Coming soon", "default")}
              className="rounded-lg border border-white/10 px-3 py-1 text-xs text-ink-disabled transition hover:border-electric-blue/40 hover:text-ink-secondary"
            >
              Connect
            </button>
          </li>
        ))}
      </ul>
    </FadeInSection>
  );
}
