export interface UserSettingsOut {
  theme: string;
  email_notifications_enabled: boolean;
  custom_instructions: string | null;
  language: string;
  updated_at: string;
}

export interface UserSettingsUpdatePatch {
  theme?: string;
  email_notifications_enabled?: boolean;
  custom_instructions?: string | null;
  language?: string;
}

export interface ExportedMessage {
  role: string;
  content: string;
  created_at: string;
}

export interface ExportedConversation {
  title: string;
  pinned: boolean;
  favorited: boolean;
  archived: boolean;
  created_at: string;
  updated_at: string;
  messages: ExportedMessage[];
}

export interface ExportDataOut {
  profile: {
    id: string;
    email: string;
    display_name: string | null;
    tier: string;
    created_at: string;
  };
  conversations: ExportedConversation[];
}
