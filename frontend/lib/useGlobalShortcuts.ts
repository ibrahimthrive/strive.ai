"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useConversations } from "@/lib/conversations-context";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useGlobalShortcuts(): void {
  const router = useRouter();
  const { newChat } = useConversations();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isTypingTarget(event.target)) return;

      switch (event.key.toLowerCase()) {
        case "n":
          event.preventDefault();
          newChat();
          router.push("/");
          break;
        case "d":
          event.preventDefault();
          router.push("/dashboard");
          break;
        case "h":
          event.preventDefault();
          router.push("/history");
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newChat, router]);
}
