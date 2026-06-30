import type { Tier } from "@/types/chat";

export interface ProfileOut {
  id: string;
  email: string;
  display_name: string | null;
  tier: Tier;
  created_at: string;
}

export interface ApiKeyOut {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  revoked_at: string | null;
}

export interface ApiKeyCreateResponse extends ApiKeyOut {
  api_key: string;
}
