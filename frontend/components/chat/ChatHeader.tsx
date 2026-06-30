"use client";

import { useState } from "react";
import { Download, Share2 } from "lucide-react";

import { ShareModal } from "@/components/chat/ShareModal";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useConversations } from "@/lib/conversations-context";
import type { Conversation } from "@/types/chat";

function estimateTokens(conversation: Conversation): number {
  const totalChars = conversation.messages.reduce((sum, message) => sum + message.content.length, 0);
  return Math.max(0, Math.round(totalChars / 4));
}

function downloadConversation(conversation: Conversation) {
  const lines = [`# ${conversation.title}`, ""];
  for (const message of conversation.messages) {
    if (!message.content) continue;
    lines.push(`### ${message.role === "user" ? "You" : "Strive"}`, "", message.content, "");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${conversation.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "conversation"}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ChatHeader({ conversation }: { conversation: Conversation }) {
  const { renameConversation } = useConversations();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(conversation.title);
  const [shareOpen, setShareOpen] = useState(false);
  const hasMessages = conversation.messages.length > 0;

  function commit() {
    setIsEditing(false);
    renameConversation(conversation.id, draft);
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-midnight-navy/40 px-6 py-4 backdrop-blur-xl">
      <div className="min-w-0">
        {isEditing ? (
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") commit();
              if (event.key === "Escape") {
                setDraft(conversation.title);
                setIsEditing(false);
              }
            }}
            className="rounded-md bg-deep-space/60 px-2 py-1 text-base font-semibold text-ink-primary focus:outline-none"
          />
        ) : (
          <button
            onClick={() => {
              setDraft(conversation.title);
              setIsEditing(true);
            }}
            className="truncate text-left text-base font-semibold text-ink-primary hover:underline"
          >
            {conversation.title}
          </button>
        )}
        <p className="text-xs text-ink-muted">~{estimateTokens(conversation).toLocaleString()} tokens in this conversation</p>
      </div>

      {hasMessages && (
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip label="Export conversation">
            <IconButton aria-label="Export conversation" onClick={() => downloadConversation(conversation)}>
              <Download size={15} />
            </IconButton>
          </Tooltip>
          <Tooltip label="Share conversation">
            <IconButton aria-label="Share conversation" onClick={() => setShareOpen(true)}>
              <Share2 size={15} />
            </IconButton>
          </Tooltip>
        </div>
      )}

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} clientId={conversation.id} />
    </header>
  );
}
