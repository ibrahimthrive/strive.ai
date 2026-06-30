"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp, LogOut, Settings, User as UserIcon } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { clearSession, readJSON, STORAGE_KEYS } from "@/lib/storage";
import { tierBadgeTone, tierLabel } from "@/lib/tier";
import type { StoredUser } from "@/types/chat";

export function SidebarProfile() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    setUser(readJSON<StoredUser>(STORAGE_KEYS.user));
  }, []);

  function handleLogout() {
    clearSession();
    router.push("/auth");
  }

  return (
    <div className="border-t border-white/5 px-3 py-3">
      <Dropdown
        placement="top"
        trigger={
          <button
            aria-label="Account menu"
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-graphite/60"
          >
            <Avatar variant="user" email={user?.email} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-ink-primary">
                {user?.display_name || user?.email || "Guest"}
              </span>
              <Badge tone={tierBadgeTone(user?.tier)}>{tierLabel(user?.tier)}</Badge>
            </span>
            <ChevronUp size={14} className="shrink-0 text-ink-disabled" />
          </button>
        }
      >
        <DropdownItem onClick={() => router.push("/profile")}>
          <UserIcon size={14} /> Profile
        </DropdownItem>
        <DropdownItem onClick={() => router.push("/settings")}>
          <Settings size={14} /> Settings
        </DropdownItem>
        <DropdownItem destructive onClick={handleLogout}>
          <LogOut size={14} /> Log out
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
