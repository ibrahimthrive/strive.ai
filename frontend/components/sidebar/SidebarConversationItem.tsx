"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Conversation } from "@/types/chat";

interface SidebarConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onTogglePinned: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}

export function SidebarConversationItem({
  conversation,
  isActive,
  onSelect,
  onTogglePinned,
  onRename,
  onDelete,
}: SidebarConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function commitRename() {
    setIsEditing(false);
    onRename(draftTitle);
  }

  return (
    <div
      className={`group mb-1 flex items-center gap-1 rounded-lg px-1 transition ${
        isActive ? "bg-graphite text-ink-primary shadow-[inset_2px_0_0_0_#2563EB]" : "text-ink-muted hover:bg-graphite/60 hover:text-ink-secondary"
      }`}
    >
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
          className="flex-1 truncate rounded-md bg-deep-space/60 px-2 py-2 text-left text-sm text-ink-primary focus:outline-none"
        />
      ) : (
        <button onClick={onSelect} className="flex-1 truncate px-2 py-2 text-left text-sm">
          {conversation.title}
        </button>
      )}

      <button
        onClick={onTogglePinned}
        aria-label={conversation.pinned ? "Unpin conversation" : "Pin conversation"}
        className={`shrink-0 rounded-md p-1.5 transition hover:bg-graphite ${
          conversation.pinned ? "text-neural-cyan opacity-100" : "text-ink-disabled opacity-0 group-hover:opacity-100"
        }`}
      >
        {conversation.pinned ? <Pin size={13} /> : <PinOff size={13} />}
      </button>

      <Dropdown
        align="right"
        trigger={
          <button
            aria-label="Conversation options"
            className="shrink-0 rounded-md p-1.5 text-ink-disabled opacity-0 transition hover:bg-graphite group-hover:opacity-100"
          >
            <MoreHorizontal size={13} />
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
    </div>
  );
}
