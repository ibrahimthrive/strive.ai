"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Pencil, RefreshCw, ThumbsDown, ThumbsUp, X } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "@/components/ui/ToastProvider";
import { CodeBlock } from "@/components/chat/CodeBlock";
import { fadeUp } from "@/lib/motion";
import { readJSON, STORAGE_KEYS } from "@/lib/storage";
import type { ChatMessage, Reaction, StoredUser } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onReaction?: (reaction: Reaction | undefined) => void;
}

function formatTime(ms: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(ms));
}

export default function MessageBubble({ message, isLastAssistant, onRegenerate, onEdit, onReaction }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { push } = useToast();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));
  const user = !isUser ? null : readJSON<StoredUser>(STORAGE_KEYS.user);

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    push("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 1500);
  }

  function commitEdit() {
    const trimmed = draft.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== message.content) onEdit?.(trimmed);
  }

  return (
    <motion.div
      initial={preset.initial}
      animate={preset.animate}
      transition={preset.transition}
      className={`group flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <Avatar variant="assistant" />}

      <div className={`flex max-w-2xl flex-col ${isUser ? "items-end" : "items-start"}`}>
        {message.imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.imageDataUrl}
            alt="Attached"
            className="mb-1.5 max-h-64 max-w-xs rounded-2xl border border-white/10 object-cover"
          />
        )}

        {isEditing ? (
          <div className="w-full min-w-[16rem]">
            <textarea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  commitEdit();
                }
                if (event.key === "Escape") {
                  setDraft(message.content);
                  setIsEditing(false);
                }
              }}
              rows={3}
              className="w-full resize-none rounded-2xl border border-neural-cyan/40 bg-deep-space/60 px-4 py-3 text-sm text-ink-primary focus:outline-none"
            />
            <div className="mt-1 flex justify-end gap-2">
              <IconButton aria-label="Cancel edit" onClick={() => { setDraft(message.content); setIsEditing(false); }} className="h-6 w-6">
                <X size={12} />
              </IconButton>
              <IconButton aria-label="Save edit" onClick={commitEdit} className="h-6 w-6">
                <Check size={12} />
              </IconButton>
            </div>
          </div>
        ) : (
          <div
            className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser ? "bg-gradient-user-bubble text-white" : "border border-white/5 bg-gradient-ai-bubble text-ink-primary"
            }`}
          >
            {message.content ? (
              isUser ? (
                message.content
              ) : (
                <div className="prose-strive">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre: ({ children }) => <>{children}</>,
                      code: ({ className, children }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const text = String(children).replace(/\n$/, "");
                        const inline = !className && !text.includes("\n");
                        if (inline) {
                          return <code className="rounded bg-graphite/80 px-1 py-0.5 text-xs">{children}</code>;
                        }
                        return <CodeBlock language={match?.[1]} code={text} />;
                      },
                      table: ({ children }) => (
                        <div className="my-2 overflow-x-auto">
                          <table className="w-full border-collapse text-xs">{children}</table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="border border-white/10 bg-graphite/60 px-2 py-1 text-left">{children}</th>
                      ),
                      td: ({ children }) => <td className="border border-white/10 px-2 py-1">{children}</td>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )
            ) : (
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neural-cyan" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neural-cyan [animation-delay:0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neural-cyan [animation-delay:0.3s]" />
              </span>
            )}
          </div>
        )}

        <div className="mt-1 flex items-center gap-2 px-1">
          <span className="text-[10px] text-ink-disabled">{formatTime(message.createdAt)}</span>
          {message.content && !isEditing && (
            <span className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <IconButton aria-label="Copy message" onClick={handleCopy} className="h-6 w-6">
                {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              </IconButton>
              {isUser && onEdit && (
                <IconButton aria-label="Edit message" onClick={() => setIsEditing(true)} className="h-6 w-6">
                  <Pencil size={12} />
                </IconButton>
              )}
              {isLastAssistant && onRegenerate && (
                <IconButton aria-label="Regenerate response" onClick={onRegenerate} className="h-6 w-6">
                  <RefreshCw size={12} />
                </IconButton>
              )}
              {!isUser && onReaction && (
                <>
                  <IconButton
                    aria-label="Good response"
                    aria-pressed={message.reaction === "up"}
                    onClick={() => onReaction(message.reaction === "up" ? undefined : "up")}
                    className={`h-6 w-6 ${message.reaction === "up" ? "text-success" : ""}`}
                  >
                    <ThumbsUp size={12} />
                  </IconButton>
                  <IconButton
                    aria-label="Bad response"
                    aria-pressed={message.reaction === "down"}
                    onClick={() => onReaction(message.reaction === "down" ? undefined : "down")}
                    className={`h-6 w-6 ${message.reaction === "down" ? "text-danger" : ""}`}
                  >
                    <ThumbsDown size={12} />
                  </IconButton>
                </>
              )}
            </span>
          )}
        </div>
      </div>

      {isUser && <Avatar variant="user" email={user?.email} />}
    </motion.div>
  );
}
