"use client";

import { Search } from "lucide-react";

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function SidebarSearch({ value, onChange }: SidebarSearchProps) {
  return (
    <div className="relative mx-3 mb-3">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-disabled" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search chats..."
        aria-label="Search conversations"
        className="w-full rounded-lg border border-white/10 bg-deep-space/40 py-1.5 pl-8 pr-3 text-xs text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
      />
    </div>
  );
}
