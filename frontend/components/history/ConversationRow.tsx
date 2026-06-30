"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Archive, ArchiveRestore, Folder as FolderIcon, MoreHorizontal, Pencil, Pin, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { relativeTime } from "@/lib/format";
import { fadeUp } from "@/lib/motion";
import type { ConversationOut, FolderOut } from "@/types/history";

interface ConversationRowProps {
  conversation: ConversationOut;
  folders: FolderOut[];
  delay?: number;
  onTogglePinned: () => void;
  onToggleFavorited: () => void;
  onToggleArchived: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onMoveToFolder: (folderId: string | null) => void;
}

export function ConversationRow({
  conversation,
  folders,
  delay = 0,
  onTogglePinned,
  onToggleFavorited,
  onToggleArchived,
  onRename,
  onDelete,
  onMoveToFolder,
}: ConversationRowProps) {
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const folderName = folders.find((folder) => folder.id === conversation.folder_id)?.name;

  function commitRename() {
    setIsEditing(false);
    onRename(draftTitle);
  }

  return (
    <motion.div
      initial={preset.initial}
      animate={preset.animate}
      transition={{ ...preset.transition, delay }}
      className="glass-panel flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:border-white/10 hover:bg-graphite/30"
    >
      <button
        onClick={onTogglePinned}
        aria-label={conversation.pinned ? "Unpin conversation" : "Pin conversation"}
        aria-pressed={conversation.pinned}
        className={`shrink-0 rounded-md p-1.5 transition hover:bg-graphite ${
          conversation.pinned ? "text-neural-cyan" : "text-ink-disabled"
        }`}
      >
        <Pin size={14} />
      </button>

      <button
        onClick={onToggleFavorited}
        aria-label={conversation.favorited ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={conversation.favorited}
        className={`shrink-0 rounded-md p-1.5 transition hover:bg-graphite ${
          conversation.favorited ? "text-warning" : "text-ink-disabled"
        }`}
      >
        <Star size={14} fill={conversation.favorited ? "currentColor" : "none"} />
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") {
                setDraftTitle(conversation.title);
                setIsEditing(false);
              }
            }}
            className="w-full rounded-md bg-deep-space/60 px-2 py-1 text-sm text-ink-primary focus:outline-none"
          />
        ) : (
          <Link
            href={`/?c=${encodeURIComponent(conversation.client_id)}`}
            className="block truncate text-sm font-medium text-ink-primary hover:underline"
          >
            {conversation.title}
          </Link>
        )}
        <p className="mt-0.5 text-[11px] text-ink-disabled">
          {conversation.message_count} messages &middot; {relativeTime(conversation.updated_at)}
          {folderName && <> &middot; {folderName}</>}
        </p>
      </div>

      <Dropdown
        align="right"
        trigger={
          <button
            aria-label="Move to folder"
            className="hidden shrink-0 items-center gap-1 rounded-md p-1.5 text-ink-disabled transition hover:bg-graphite sm:inline-flex"
          >
            <FolderIcon size={14} />
          </button>
        }
      >
        <DropdownItem onClick={() => onMoveToFolder(null)}>No folder</DropdownItem>
        {folders.map((folder) => (
          <DropdownItem key={folder.id} onClick={() => onMoveToFolder(folder.id)}>
            {folder.name}
          </DropdownItem>
        ))}
      </Dropdown>

      <button
        onClick={onToggleArchived}
        aria-label={conversation.archived ? "Unarchive conversation" : "Archive conversation"}
        className="shrink-0 rounded-md p-1.5 text-ink-disabled transition hover:bg-graphite"
      >
        {conversation.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
      </button>

      <Dropdown
        align="right"
        trigger={
          <button aria-label="Conversation options" className="shrink-0 rounded-md p-1.5 text-ink-disabled transition hover:bg-graphite">
            <MoreHorizontal size={14} />
          </button>
        }
      >
        <DropdownItem
          onClick={() => {
            setDraftTitle(conversation.title);
            setIsEditing(true);
          }}
        >
          <Pencil size={14} /> Rename
        </DropdownItem>
        <DropdownItem destructive onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} /> Delete
        </DropdownItem>
      </Dropdown>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this chat?">
        <p className="mb-5 text-sm text-ink-muted">
          &ldquo;{conversation.title}&rdquo; will be permanently deleted. This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              setConfirmDelete(false);
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
}
