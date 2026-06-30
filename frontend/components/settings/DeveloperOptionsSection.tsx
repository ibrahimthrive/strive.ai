"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { useToast } from "@/components/ui/ToastProvider";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function DeveloperOptionsSection() {
  const { push } = useToast();

  function copyDebugInfo() {
    const info = [`API base URL: ${API_BASE_URL}`, `User agent: ${navigator.userAgent}`].join("\n");
    void navigator.clipboard.writeText(info);
    push("Debug info copied.", "success");
  }

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Developer Options</h2>
      <p className="mt-2 text-xs text-ink-disabled">API base URL</p>
      <code className="text-sm text-ink-secondary">{API_BASE_URL}</code>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={copyDebugInfo}>
          Copy debug info
        </Button>
        <Link href="/profile">
          <Button variant="secondary" size="sm">
            Manage API keys
          </Button>
        </Link>
      </div>
    </FadeInSection>
  );
}
