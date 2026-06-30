"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Mic, Paperclip, X } from "lucide-react";

import { ChatHeader } from "@/components/chat/ChatHeader";
import MessageBubble from "@/components/MessageBubble";
import AppShell from "@/components/AppShell";
import EmptyStateIllustration from "@/components/brand/EmptyStateIllustration";
import { Spinner } from "@/components/ui/Spinner";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/ToastProvider";
import { useConversations } from "@/lib/conversations-context";

const NEAR_BOTTOM_THRESHOLD_PX = 80;
const MAX_INPUT_CHARS = 4000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [input, setInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; name: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wasNearBottomRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    conversations,
    activeConversation,
    isStreaming,
    error,
    selectConversation,
    sendMessage,
    regenerate,
    editMessage,
    retry,
    setReaction,
  } = useConversations();

  useEffect(() => {
    const requestedId = searchParams.get("c");
    if (requestedId && conversations.some((conversation) => conversation.id === requestedId)) {
      selectConversation(requestedId);
    }
  }, [searchParams, conversations, selectConversation]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (wasNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeConversation.messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD_PX;
    wasNearBottomRef.current = nearBottom;
    setIsNearBottom(nearBottom);
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    wasNearBottomRef.current = true;
    setIsNearBottom(true);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      push("Only image attachments are supported right now.", "error");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      push("Images must be under 5MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage({ dataUrl: reader.result, name: file.name });
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSend() {
    const content = input.trim();
    if ((!content && !attachedImage) || isStreaming) return;
    setInput("");
    const image = attachedImage?.dataUrl;
    setAttachedImage(null);
    wasNearBottomRef.current = true;
    await sendMessage(content, image);
  }

  const lastAssistantId = [...activeConversation.messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <AppShell>
      <main className="flex flex-1 flex-col">
        <ChatHeader conversation={activeConversation} />

        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="scroll-thin h-full space-y-4 overflow-y-auto px-6 py-6"
          >
            {activeConversation.messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <EmptyStateIllustration />
                <p className="text-sm text-ink-muted">Ask Strive anything to get started.</p>
              </div>
            )}
            {activeConversation.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isLastAssistant={message.role === "assistant" && message.id === lastAssistantId}
                onRegenerate={() => void regenerate(message.id)}
                onEdit={message.role === "user" ? (content) => void editMessage(message.id, content) : undefined}
                onReaction={
                  message.role === "assistant" ? (reaction) => setReaction(message.id, reaction) : undefined
                }
              />
            ))}
            {error && (
              <div className="flex items-center gap-2 text-sm text-danger">
                <span>{error}</span>
                <button onClick={() => void retry()} className="font-medium underline hover:no-underline">
                  Retry
                </button>
              </div>
            )}
          </div>

          {!isNearBottom && activeConversation.messages.length > 0 && (
            <button
              onClick={scrollToBottom}
              aria-label="Scroll to latest message"
              className="absolute bottom-4 right-6 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-midnight-navy/90 text-ink-secondary shadow-lg backdrop-blur transition hover:text-ink-primary"
            >
              <ArrowDown size={16} />
            </button>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
          className="border-t border-white/5 px-6 py-4"
        >
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingFile(false);
              handleFiles(event.dataTransfer.files);
            }}
            className={`glass-panel rounded-3xl px-3 py-2 transition focus-within:border-neural-cyan/40 focus-within:ring-1 focus-within:ring-neural-cyan/30 ${
              isDraggingFile ? "border-neural-cyan/60 ring-1 ring-neural-cyan/40" : ""
            }`}
          >
            {attachedImage && (
              <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-deep-space/40 px-2 py-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachedImage.dataUrl} alt={attachedImage.name} className="h-10 w-10 rounded-md object-cover" />
                <span className="flex-1 truncate text-xs text-ink-secondary">{attachedImage.name}</span>
                <IconButton aria-label="Remove attachment" onClick={() => setAttachedImage(null)} className="h-6 w-6">
                  <X size={12} />
                </IconButton>
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  handleFiles(event.target.files);
                  event.target.value = "";
                }}
              />
              <Tooltip label="Attach image">
                <IconButton aria-label="Attach image" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="Coming soon">
                <IconButton aria-label="Voice input" disabled>
                  <Mic size={16} />
                </IconButton>
              </Tooltip>

              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value.slice(0, MAX_INPUT_CHARS))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder="Message Strive..."
                className="flex-1 resize-none bg-transparent py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none"
              />

              <motion.button
                type="submit"
                disabled={isStreaming || (!input.trim() && !attachedImage)}
                whileHover={!isStreaming && (input.trim() || attachedImage) ? { scale: 1.05 } : undefined}
                whileTap={!isStreaming && (input.trim() || attachedImage) ? { scale: 0.95 } : undefined}
                aria-label={isStreaming ? "Sending" : "Send message"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white transition hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isStreaming ? <Spinner size={18} /> : <ArrowUp size={16} />}
              </motion.button>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between px-2">
            <p className="text-[11px] text-ink-disabled">Enter to send &middot; Shift + Enter for a new line</p>
            <p className="text-[11px] text-ink-disabled">
              {input.length} / {MAX_INPUT_CHARS}
            </p>
          </div>
        </form>
      </main>
    </AppShell>
  );
}
