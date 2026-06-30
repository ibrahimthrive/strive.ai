import type { Tier } from "@/types/chat";

export function tierLabel(tier: Tier | undefined): string {
  if (tier === "business") return "Business";
  if (tier === "pro") return "Pro";
  return "Free";
}

export function tierBadgeTone(tier: Tier | undefined): "free" | "pro" | "business" {
  if (tier === "business") return "business";
  if (tier === "pro") return "pro";
  return "free";
}
