"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Check, Copy } from "lucide-react";
import type { CSSProperties } from "react";

import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/ToastProvider";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter/dist/esm/prism-async-light").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => null,
  }
);

let stylePromise: Promise<unknown> | null = null;
function loadStyle() {
  stylePromise ??= import("react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus").then((m) => m.default);
  return stylePromise;
}

interface CodeBlockProps {
  language?: string;
  code: string;
}

export function CodeBlock({ language, code }: CodeBlockProps) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);
  const [style, setStyle] = useState<{ [key: string]: CSSProperties } | null>(null);

  if (!style) {
    void loadStyle().then((loaded) => setStyle(loaded as { [key: string]: CSSProperties }));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    push("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="group relative my-2 overflow-hidden rounded-xl border border-white/10 bg-midnight-navy">
      <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
        <span className="text-[11px] uppercase tracking-wide text-ink-disabled">{language || "text"}</span>
        <IconButton aria-label="Copy code" onClick={handleCopy} className="h-6 w-6">
          {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
        </IconButton>
      </div>
      {style ? (
        <SyntaxHighlighter
          language={language || "text"}
          style={style}
          customStyle={{ margin: 0, background: "transparent", fontSize: "0.8rem", padding: "0.75rem 1rem" }}
        >
          {code}
        </SyntaxHighlighter>
      ) : (
        <pre className="overflow-x-auto px-4 py-3 text-xs text-ink-secondary">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
