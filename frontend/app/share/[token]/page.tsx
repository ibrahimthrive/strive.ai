"use client";

import { useEffect, useState } from "react";

import MessageBubble from "@/components/MessageBubble";
import StriveLockup from "@/components/brand/StriveLockup";
import { Spinner } from "@/components/ui/Spinner";
import { ApiError, fetchSharedConversation } from "@/lib/api";
import type { ChatMessage } from "@/types/chat";

export default function SharedConversationPage({ params }: { params: { token: string } }) {
  const [title, setTitle] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSharedConversation(params.token)
      .then((data) => {
        setTitle(data.title);
        setMessages(
          data.messages.map((message, index) => ({
            id: `${index}`,
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
            createdAt: new Date(message.created_at).getTime(),
          }))
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "This shared conversation is no longer available.");
      });
  }, [params.token]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-app">
      <header className="border-b border-white/5 bg-midnight-navy/40 px-6 py-4 backdrop-blur-xl">
        <StriveLockup />
        {title && <p className="mt-1 text-xs text-ink-muted">Shared conversation &middot; {title}</p>}
      </header>

      <div className="scroll-thin mx-auto w-full max-w-3xl flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && messages === null && (
          <div className="flex h-full items-center justify-center py-16">
            <Spinner size={24} />
          </div>
        )}
        {messages?.map((message) => <MessageBubble key={message.id} message={message} />)}
      </div>
    </div>
  );
}
