export type ChatRole = "user" | "assistant";

export type Reaction = "up" | "down";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  imageDataUrl?: string;
  reaction?: Reaction;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  pinned: boolean;
  updatedAt: number;
}

export type Tier = "free" | "pro" | "business";

export interface StoredUser {
  id: string;
  email: string;
  display_name?: string | null;
  tier: Tier;
}
