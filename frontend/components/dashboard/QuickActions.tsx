"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { FileSearch, Image as ImageIcon, MessageSquarePlus, Search, Upload } from "lucide-react";

import { useToast } from "@/components/ui/ToastProvider";
import { useConversations } from "@/lib/conversations-context";
import { fadeUp } from "@/lib/motion";

const ACTIONS = [
  { key: "new-chat", label: "New Chat", icon: MessageSquarePlus, accent: "bg-gradient-primary" },
  { key: "search", label: "Search Intelligence", icon: Search, accent: "bg-gradient-ai" },
  { key: "upload", label: "Upload File", icon: Upload, accent: "bg-gradient-primary" },
  { key: "image", label: "Generate Image", icon: ImageIcon, accent: "bg-gradient-ai" },
  { key: "pdf", label: "Analyze PDF", icon: FileSearch, accent: "bg-gradient-primary" },
] as const;

export function QuickActions() {
  const router = useRouter();
  const { newChat } = useConversations();
  const { push } = useToast();
  const shouldReduceMotion = useReducedMotion();
  const preset = fadeUp(Boolean(shouldReduceMotion));

  function handleClick(key: string) {
    if (key === "new-chat") {
      newChat();
      router.push("/");
      return;
    }
    push("Coming soon", "default");
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ACTIONS.map(({ key, label, icon: Icon, accent }, index) => (
        <motion.button
          key={key}
          type="button"
          onClick={() => handleClick(key)}
          initial={preset.initial}
          animate={preset.animate}
          transition={{ ...preset.transition, delay: index * 0.04 }}
          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          className="glass-panel flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:border-electric-blue/30"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent} text-white`}>
            <Icon size={16} />
          </span>
          <span className="text-xs font-medium text-ink-secondary">{label}</span>
        </motion.button>
      ))}
    </div>
  );
}
