export type ConversationView = "active" | "archived" | "pinned" | "favorited";
export type ConversationSort = "updated_desc" | "updated_asc" | "title_asc" | "created_desc";

export interface ConversationOut {
  client_id: string;
  title: string;
  pinned: boolean;
  favorited: boolean;
  archived: boolean;
  folder_id: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationUpdatePatch {
  title?: string;
  pinned?: boolean;
  favorited?: boolean;
  archived?: boolean;
  folder_id?: string | null;
}

export interface FolderOut {
  id: string;
  name: string;
  created_at: string;
  conversation_count: number;
}

export interface ListConversationsParams {
  folderId?: string;
  view?: ConversationView;
  q?: string;
  sort?: ConversationSort;
}
