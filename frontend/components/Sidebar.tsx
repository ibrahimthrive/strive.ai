"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, CreditCard, History, LayoutDashboard, MessageSquare, Plus } from "lucide-react";

import StriveLockup from "@/components/brand/StriveLockup";
import StriveMark from "@/components/brand/StriveMark";
import { Button } from "@/components/ui/Button";
import { SidebarSearch } from "@/components/sidebar/SidebarSearch";
import { SidebarConversationItem } from "@/components/sidebar/SidebarConversationItem";
import { SidebarProfile } from "@/components/sidebar/SidebarProfile";
import { useConversations } from "@/lib/conversations-context";
import { readJSON, STORAGE_KEYS, writeJSON } from "@/lib/storage";

const NAV_ITEMS = [
  { href: "/", label: "Chat", icon: MessageSquare, matchPrefix: "/" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, matchPrefix: "/dashboard" },
  { href: "/history", label: "History", icon: History, matchPrefix: "/history" },
  { href: "/billing/manage", label: "Billing", icon: CreditCard, matchPrefix: "/billing" },
];

function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  return (
    <nav className={collapsed ? "flex flex-col items-center gap-1" : "flex flex-col gap-0.5 px-2 pb-2"}>
      {NAV_ITEMS.map(({ href, label, icon: Icon, matchPrefix }) => {
        const isActive = matchPrefix === "/" ? pathname === "/" : pathname.startsWith(matchPrefix);
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg text-xs font-medium transition ${
              collapsed ? "p-2" : "px-3 py-2"
            } ${
              isActive
                ? "bg-graphite/70 text-ink-primary"
                : "text-ink-muted hover:bg-graphite/50 hover:text-ink-secondary"
            }`}
          >
            <Icon size={16} />
            {!collapsed && label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Sidebar() {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    newChat,
    togglePinned,
    renameConversation,
    deleteConversation,
  } = useConversations();

  const [query, setQuery] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(() => readJSON<boolean>(STORAGE_KEYS.sidebarCollapsed) ?? false);

  function toggleCollapsed() {
    setIsCollapsed((prev) => {
      const next = !prev;
      writeJSON(STORAGE_KEYS.sidebarCollapsed, next);
      return next;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;
    return {
      pinned: list.filter((c) => c.pinned),
      recent: list.filter((c) => !c.pinned).sort((a, b) => b.updatedAt - a.updatedAt),
    };
  }, [conversations, query]);

  if (isCollapsed) {
    return (
      <aside className="flex h-full w-16 flex-col items-center border-r border-white/5 bg-midnight-navy/80 py-4 backdrop-blur-xl transition-[width] duration-300">
        <button onClick={toggleCollapsed} aria-label="Expand sidebar" className="mb-6">
          <StriveMark size={28} />
        </button>
        <Button variant="secondary" size="sm" onClick={newChat} aria-label="New chat" className="mb-3 px-2.5">
          <Plus size={16} />
        </Button>
        <SidebarNav collapsed />
        <button
          onClick={toggleCollapsed}
          aria-label="Expand sidebar"
          className="mt-auto rounded-lg p-2 text-ink-disabled transition hover:bg-graphite/60 hover:text-ink-secondary"
        >
          <ChevronsRight size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-white/5 bg-midnight-navy/80 backdrop-blur-xl transition-[width] duration-300">
      <div className="flex items-center justify-between px-4 py-4">
        <StriveLockup />
        <button
          onClick={toggleCollapsed}
          aria-label="Collapse sidebar"
          className="rounded-lg p-1.5 text-ink-disabled transition hover:bg-graphite/60 hover:text-ink-secondary"
        >
          <ChevronsLeft size={16} />
        </button>
      </div>

      <SidebarNav collapsed={false} />

      <Button variant="secondary" onClick={newChat} className="mx-3 mb-3 justify-start">
        <Plus size={16} /> New chat
      </Button>

      <SidebarSearch value={query} onChange={setQuery} />

      <nav className="scroll-thin flex-1 overflow-y-auto px-2">
        {filtered.pinned.length > 0 && (
          <>
            <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-disabled">
              Pinned
            </p>
            {filtered.pinned.map((conversation) => (
              <SidebarConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onSelect={() => selectConversation(conversation.id)}
                onTogglePinned={() => togglePinned(conversation.id)}
                onRename={(title) => renameConversation(conversation.id, title)}
                onDelete={() => deleteConversation(conversation.id)}
              />
            ))}
          </>
        )}

        {filtered.recent.length > 0 && (
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-ink-disabled">Recent</p>
        )}
        {filtered.recent.map((conversation) => (
          <SidebarConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={() => selectConversation(conversation.id)}
            onTogglePinned={() => togglePinned(conversation.id)}
            onRename={(title) => renameConversation(conversation.id, title)}
            onDelete={() => deleteConversation(conversation.id)}
          />
        ))}

        {filtered.pinned.length === 0 && filtered.recent.length === 0 && (
          <p className="px-3 py-4 text-xs text-ink-disabled">No chats match your search.</p>
        )}
      </nav>

      <SidebarProfile />
    </aside>
  );
}
