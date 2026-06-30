export interface UsageStat {
  today: number;
  week: number;
  month: number;
  total: number;
}

export interface ConversationSummary {
  client_id: string;
  title: string;
  pinned: boolean;
  message_count: number;
  updated_at: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface ActivityItem {
  conversation_title: string;
  preview: string;
  created_at: string;
}

export interface DashboardSummary {
  messages_sent: UsageStat;
  ai_requests: UsageStat;
  tokens_used: UsageStat;
  avg_response_ms: number | null;
  storage_bytes: number;
  files_uploaded: number;
  remaining_uploads: number | null;
  recent_conversations: ConversationSummary[];
  weekly_series: SeriesPoint[];
  monthly_series: SeriesPoint[];
  activity: ActivityItem[];
}
