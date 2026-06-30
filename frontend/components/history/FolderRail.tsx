"use client";

import { useState } from "react";
import { Folder as FolderIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";

import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import type { FolderOut } from "@/types/history";

export type FolderSelection = "all" | "none" | string;

interface FolderRailProps {
  folders: FolderOut[];
  selected: FolderSelection;
  onSelect: (selection: FolderSelection) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function chipClasses(active: boolean): string {
  return `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
    active ? "bg-gradient-primary text-white" : "bg-graphite/60 text-ink-muted hover:text-ink-secondary"
  }`;
}

export function FolderRail({ folders, selected, onSelect, onCreate, onRename, onDelete }: FolderRailProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  function commitCreate() {
    const trimmed = draftName.trim();
    if (trimmed) onCreate(trimmed);
    setDraftName("");
    setIsCreating(false);
  }

  function commitRename(id: string) {
    const trimmed = renameDraft.trim();
    if (trimmed) onRename(id, trimmed);
    setRenamingId(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => onSelect("all")} className={chipClasses(selected === "all")}>
        All chats
      </button>
      <button onClick={() => onSelect("none")} className={chipClasses(selected === "none")}>
        No folder
      </button>

      {folders.map((folder) =>
        renamingId === folder.id ? (
          <input
            key={folder.id}
            autoFocus
            value={renameDraft}
            onChange={(event) => setRenameDraft(event.target.value)}
            onBlur={() => commitRename(folder.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename(folder.id);
              if (event.key === "Escape") setRenamingId(null);
            }}
            className="w-32 rounded-full bg-deep-space/60 px-3 py-1.5 text-xs text-ink-primary focus:outline-none"
          />
        ) : (
          <div key={folder.id} className={chipClasses(selected === folder.id)}>
            <button onClick={() => onSelect(folder.id)} className="flex items-center gap-1.5">
              <FolderIcon size={12} />
              {folder.name}
              <span className="text-[10px] opacity-70">{folder.conversation_count}</span>
            </button>
            <Dropdown
              align="right"
              trigger={
                <button aria-label={`${folder.name} options`} className="rounded p-0.5 opacity-70 hover:opacity-100">
                  <MoreHorizontal size={12} />
                </button>
              }
            >
              <DropdownItem
                onClick={() => {
                  setRenameDraft(folder.name);
                  setRenamingId(folder.id);
                }}
              >
                <Pencil size={14} /> Rename
              </DropdownItem>
              <DropdownItem destructive onClick={() => onDelete(folder.id)}>
                <Trash2 size={14} /> Delete
              </DropdownItem>
            </Dropdown>
          </div>
        )
      )}

      {isCreating ? (
        <input
          autoFocus
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitCreate}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitCreate();
            if (event.key === "Escape") {
              setDraftName("");
              setIsCreating(false);
            }
          }}
          placeholder="Folder name"
          className="w-32 rounded-full border border-white/10 bg-deep-space/60 px-3 py-1.5 text-xs text-ink-primary placeholder:text-ink-disabled focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-white/15 px-3 py-1.5 text-xs text-ink-disabled transition hover:border-electric-blue/40 hover:text-ink-secondary"
        >
          <Plus size={12} /> New folder
        </button>
      )}
    </div>
  );
}
