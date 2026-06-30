"use client";

import { useCallback, useEffect, useState } from "react";

import AppShell from "@/components/AppShell";
import { ConversationRow } from "@/components/history/ConversationRow";
import { FolderRail, type FolderSelection } from "@/components/history/FolderRail";
import { HistoryEmptyState } from "@/components/history/HistoryEmptyState";
import { HistoryFilters } from "@/components/history/HistoryFilters";
import { HistorySkeleton } from "@/components/history/HistorySkeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ApiError,
  createFolder,
  deleteConversationRemote,
  deleteFolder,
  fetchConversations,
  fetchFolders,
  updateConversation,
  updateFolder,
} from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { STORAGE_KEYS } from "@/lib/storage";
import type {
  ConversationOut,
  ConversationSort,
  ConversationUpdatePatch,
  ConversationView,
  FolderOut,
} from "@/types/history";

const STAGGER_STEP = 0.04;

function HistoryContent() {
  const { push } = useToast();
  const [folders, setFolders] = useState<FolderOut[]>([]);
  const [conversations, setConversations] = useState<ConversationOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [view, setView] = useState<ConversationView>("active");
  const [sort, setSort] = useState<ConversationSort>("updated_desc");
  const [selectedFolder, setSelectedFolder] = useState<FolderSelection>("all");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const reloadFolders = useCallback(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    fetchFolders(accessToken)
      .then(setFolders)
      .catch(() => setFolders([]));
  }, []);

  const reloadConversations = useCallback(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return undefined;

    const controller = new AbortController();
    fetchConversations(
      accessToken,
      {
        view,
        q: debouncedSearch || undefined,
        sort,
        folderId: selectedFolder !== "all" && selectedFolder !== "none" ? selectedFolder : undefined,
      },
      controller.signal
    )
      .then((list) => {
        setConversations(selectedFolder === "none" ? list.filter((item) => item.folder_id === null) : list);
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load your conversations.");
      });

    return () => controller.abort();
  }, [view, debouncedSearch, sort, selectedFolder]);

  useEffect(() => {
    reloadFolders();
  }, [reloadFolders]);

  useEffect(() => reloadConversations(), [reloadConversations]);

  function withAccessToken(action: (accessToken: string) => Promise<void>) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    action(accessToken).catch(() => push("Something went wrong. Please try again.", "error"));
  }

  function handlePatch(clientId: string, patch: ConversationUpdatePatch) {
    withAccessToken(async (accessToken) => {
      await updateConversation(accessToken, clientId, patch);
      reloadConversations();
    });
  }

  function handleDelete(clientId: string) {
    withAccessToken(async (accessToken) => {
      await deleteConversationRemote(accessToken, clientId);
      reloadConversations();
    });
  }

  function handleCreateFolder(name: string) {
    withAccessToken(async (accessToken) => {
      await createFolder(accessToken, name);
      reloadFolders();
    });
  }

  function handleRenameFolder(id: string, name: string) {
    withAccessToken(async (accessToken) => {
      await updateFolder(accessToken, id, name);
      reloadFolders();
    });
  }

  function handleDeleteFolder(id: string) {
    withAccessToken(async (accessToken) => {
      await deleteFolder(accessToken, id);
      if (selectedFolder === id) setSelectedFolder("all");
      reloadFolders();
      reloadConversations();
      push("Folder deleted. Its conversations moved to No folder.", "success");
    });
  }

  const emptyMessage =
    debouncedSearch || view !== "active" || selectedFolder !== "all"
      ? "No conversations match your filters."
      : "No conversations yet. Start chatting to build your history.";

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Conversation History</h1>
          <p className="text-sm text-ink-muted">
            Search, organize, and revisit everything you&apos;ve discussed with Strive.
          </p>
        </div>

        <HistoryFilters
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
          sort={sort}
          onSortChange={setSort}
        />

        <FolderRail
          folders={folders}
          selected={selectedFolder}
          onSelect={setSelectedFolder}
          onCreate={handleCreateFolder}
          onRename={handleRenameFolder}
          onDelete={handleDeleteFolder}
        />

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : conversations === null ? (
          <HistorySkeleton />
        ) : conversations.length === 0 ? (
          <HistoryEmptyState message={emptyMessage} />
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation, index) => (
              <ConversationRow
                key={conversation.client_id}
                conversation={conversation}
                folders={folders}
                delay={index * STAGGER_STEP}
                onTogglePinned={() => handlePatch(conversation.client_id, { pinned: !conversation.pinned })}
                onToggleFavorited={() => handlePatch(conversation.client_id, { favorited: !conversation.favorited })}
                onToggleArchived={() => handlePatch(conversation.client_id, { archived: !conversation.archived })}
                onRename={(title) => handlePatch(conversation.client_id, { title })}
                onDelete={() => handleDelete(conversation.client_id)}
                onMoveToFolder={(folderId) => handlePatch(conversation.client_id, { folder_id: folderId })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <HistoryContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
