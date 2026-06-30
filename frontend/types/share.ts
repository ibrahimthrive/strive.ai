export interface SharedMessageOut {
  role: string;
  content: string;
  created_at: string;
}

export interface SharedConversationOut {
  title: string;
  created_at: string;
  messages: SharedMessageOut[];
}
