"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, deleteConversationRemote, streamChat, updateConversation as updateConversationRemote } from "@/lib/api";
import { readJSON, STORAGE_KEYS, writeJSON } from "@/lib/storage";
import type { ChatMessage, Conversation, Reaction } from "@/types/chat";

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function createConversation(): Conversation {
  const now = Date.now();
  return { id: createId(), title: "New chat", messages: [], pinned: false, updatedAt: now };
}

function normalizeConversation(raw: Partial<Conversation>): Conversation {
  const now = Date.now();
  return {
    id: raw.id ?? createId(),
    title: raw.title ?? "New chat",
    pinned: raw.pinned ?? false,
    updatedAt: raw.updatedAt ?? now,
    messages: (raw.messages ?? []).map((message) => ({
      id: message.id ?? createId(),
      role: message.role,
      content: message.content ?? "",
      createdAt: message.createdAt ?? now,
      imageDataUrl: message.imageDataUrl,
      reaction: message.reaction,
    })),
  };
}

interface RunParams {
  conversationId: string;
  conversationTitle: string;
  history: ChatMessage[];
  assistantMessageId: string;
}

interface ConversationsContextValue {
  conversations: Conversation[];
  activeConversationId: string;
  activeConversation: Conversation;
  isStreaming: boolean;
  error: string | null;
  selectConversation: (id: string) => void;
  newChat: () => void;
  sendMessage: (content: string, imageDataUrl?: string) => Promise<void>;
  regenerate: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  retry: () => Promise<void>;
  setReaction: (messageId: string, reaction: Reaction | undefined) => void;
  togglePinned: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const stored = readJSON<Conversation[]>(STORAGE_KEYS.conversations);
    if (stored && stored.length > 0) return stored.map(normalizeConversation);
    return [createConversation()];
  });
  const [activeConversationId, setActiveConversationId] = useState<string>(() => conversations[0]!.id);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastRunRef = useRef<RunParams | null>(null);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.conversations, conversations);
  }, [conversations]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? conversations[0]!,
    [conversations, activeConversationId]
  );

  const updateConversation = useCallback((id: string, updater: (conversation: Conversation) => Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }, []);

  const newChat = useCallback(() => {
    const conversation = createConversation();
    setConversations((prev) => [conversation, ...prev]);
    setActiveConversationId(conversation.id);
    setError(null);
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setError(null);
  }, []);

  const syncConversationPatch = useCallback((id: string, patch: { title?: string; pinned?: boolean }) => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    updateConversationRemote(accessToken, id, patch).catch(() => {
      // best-effort: local state already reflects the change regardless of backend sync outcome
    });
  }, []);

  const togglePinned = useCallback(
    (id: string) => {
      const target = conversations.find((c) => c.id === id);
      if (!target) return;
      const nextPinned = !target.pinned;
      updateConversation(id, (c) => ({ ...c, pinned: nextPinned, updatedAt: Date.now() }));
      syncConversationPatch(id, { pinned: nextPinned });
    },
    [conversations, updateConversation, syncConversationPatch]
  );

  const renameConversation = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const finalTitle = trimmed.slice(0, 60);
      updateConversation(id, (c) => ({ ...c, title: finalTitle, updatedAt: Date.now() }));
      syncConversationPatch(id, { title: finalTitle });
    },
    [updateConversation, syncConversationPatch]
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        const result = next.length > 0 ? next : [createConversation()];
        if (id === activeConversationId) {
          setActiveConversationId(result[0]!.id);
        }
        return result;
      });
      const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
      if (accessToken) {
        deleteConversationRemote(accessToken, id).catch(() => {
          // best-effort: conversation is already removed locally regardless of backend sync outcome
        });
      }
    },
    [activeConversationId]
  );

  const setReaction = useCallback(
    (messageId: string, reaction: Reaction | undefined) => {
      updateConversation(activeConversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === messageId ? { ...m, reaction } : m)),
      }));
    },
    [activeConversationId, updateConversation]
  );

  const runStream = useCallback(
    async (conversationId: string, conversationTitle: string, history: ChatMessage[], assistantMessageId: string) => {
      lastRunRef.current = { conversationId, conversationTitle, history, assistantMessageId };

      const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
      if (!accessToken) {
        router.push("/auth");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);
      setError(null);

      try {
        await streamChat({
          messages: history.map((m) => ({ role: m.role, content: m.content, image_data_url: m.imageDataUrl })),
          accessToken,
          signal: controller.signal,
          conversationId,
          conversationTitle,
          onToken: (token) => {
            updateConversation(conversationId, (c) => ({
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, content: m.content + token } : m
              ),
            }));
          },
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.localStorage.removeItem(STORAGE_KEYS.accessToken);
          router.push("/auth");
          return;
        }
        setError(err instanceof Error ? err.message : "Something went wrong talking to Strive.");
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [router, updateConversation]
  );

  const sendMessage = useCallback(
    async (content: string, imageDataUrl?: string) => {
      const trimmed = content.trim();
      const messageText = trimmed || (imageDataUrl ? "(Image)" : "");
      if (!messageText || isStreaming) return;

      const conversationId = activeConversationId;
      const now = Date.now();
      const title = activeConversation.messages.length === 0 ? messageText.slice(0, 40) : activeConversation.title;
      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: messageText,
        createdAt: now,
        imageDataUrl,
      };
      const assistantMessage: ChatMessage = { id: createId(), role: "assistant", content: "", createdAt: now };
      const history = [...activeConversation.messages, userMessage];

      updateConversation(conversationId, (c) => ({
        ...c,
        title,
        updatedAt: now,
        messages: [...c.messages, userMessage, assistantMessage],
      }));

      await runStream(conversationId, title, history, assistantMessage.id);
    },
    [activeConversationId, activeConversation, isStreaming, updateConversation, runStream]
  );

  const regenerate = useCallback(
    async (messageId: string) => {
      if (isStreaming) return;
      const conversationId = activeConversationId;
      const index = activeConversation.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const history = activeConversation.messages.slice(0, index);
      updateConversation(conversationId, (c) => ({
        ...c,
        updatedAt: Date.now(),
        messages: c.messages.map((m) => (m.id === messageId ? { ...m, content: "" } : m)),
      }));

      await runStream(conversationId, activeConversation.title, history, messageId);
    },
    [activeConversationId, activeConversation, isStreaming, updateConversation, runStream]
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed || isStreaming) return;
      const conversationId = activeConversationId;
      const index = activeConversation.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const editedMessage: ChatMessage = { ...activeConversation.messages[index]!, content: trimmed };
      const assistantMessage: ChatMessage = { id: createId(), role: "assistant", content: "", createdAt: Date.now() };
      const history = [...activeConversation.messages.slice(0, index), editedMessage];

      updateConversation(conversationId, (c) => ({
        ...c,
        updatedAt: Date.now(),
        messages: [...c.messages.slice(0, index), editedMessage, assistantMessage],
      }));

      await runStream(conversationId, activeConversation.title, history, assistantMessage.id);
    },
    [activeConversationId, activeConversation, isStreaming, updateConversation, runStream]
  );

  const retry = useCallback(async () => {
    const last = lastRunRef.current;
    if (!last || isStreaming) return;
    updateConversation(last.conversationId, (c) => ({
      ...c,
      messages: c.messages.map((m) => (m.id === last.assistantMessageId ? { ...m, content: "" } : m)),
    }));
    await runStream(last.conversationId, last.conversationTitle, last.history, last.assistantMessageId);
  }, [isStreaming, updateConversation, runStream]);

  const value: ConversationsContextValue = {
    conversations,
    activeConversationId,
    activeConversation,
    isStreaming,
    error,
    selectConversation,
    newChat,
    sendMessage,
    regenerate,
    editMessage,
    retry,
    setReaction,
    togglePinned,
    renameConversation,
    deleteConversation,
  };

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}

export function useConversations(): ConversationsContextValue {
  const ctx = useContext(ConversationsContext);
  if (!ctx) throw new Error("useConversations must be used within a ConversationsProvider");
  return ctx;
}
