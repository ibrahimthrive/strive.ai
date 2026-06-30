"use client";

import { Search } from "lucide-react";

import type { ConversationSort, ConversationView } from "@/types/history";

const VIEW_OPTIONS: { value: ConversationView; label: string }[] = [
  { value: "active", label: "All" },
  { value: "pinned", label: "Pinned" },
  { value: "favorited", label: "Favorites" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS: { value: ConversationSort; label: string }[] = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "updated_asc", label: "Oldest updated" },
  { value: "created_desc", label: "Newest first" },
  { value: "title_asc", label: "Title A-Z" },
];

interface HistoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  view: ConversationView;
  onViewChange: (view: ConversationView) => void;
  sort: ConversationSort;
  onSortChange: (sort: ConversationSort) => void;
}

export function HistoryFilters({ search, onSearchChange, view, onViewChange, sort, onSortChange }: HistoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[12rem] flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search conversations..."
          aria-label="Search conversation history"
          className="w-full rounded-lg border border-white/10 bg-deep-space/40 py-2 pl-8 pr-3 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-deep-space/40 p-1">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onViewChange(option.value)}
            aria-pressed={view === option.value}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              view === option.value ? "bg-graphite text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as ConversationSort)}
        aria-label="Sort conversations"
        className="rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-xs text-ink-secondary focus:border-neural-cyan/40 focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-midnight-navy">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
