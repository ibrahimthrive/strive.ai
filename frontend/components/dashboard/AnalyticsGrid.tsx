import { Activity, Cloud, Database, FileText, Gauge, MessageSquare, Sparkles, Zap } from "lucide-react";

import { StatCard, type StatCardProps } from "@/components/dashboard/StatCard";
import { formatBytes, formatMs } from "@/lib/format";
import type { DashboardSummary } from "@/types/dashboard";

const STAGGER_STEP = 0.05;

export function AnalyticsGrid({ summary }: { summary: DashboardSummary }) {
  const cards: Omit<StatCardProps, "delay">[] = [
    {
      icon: MessageSquare,
      label: "Messages Sent",
      value: summary.messages_sent.total,
      subLabel: `${summary.messages_sent.today} today`,
      accent: "bg-gradient-primary",
    },
    {
      icon: Gauge,
      label: "Avg Response Time",
      value: summary.avg_response_ms ?? 0,
      format: formatMs,
      subLabel: "Last 30 days",
      accent: "bg-gradient-ai",
    },
    {
      icon: Sparkles,
      label: "AI Requests",
      value: summary.ai_requests.total,
      subLabel: `${summary.ai_requests.today} today`,
      accent: "bg-gradient-primary",
    },
    {
      icon: FileText,
      label: "Files Uploaded",
      value: summary.files_uploaded,
      subLabel: "All time",
      accent: "bg-gradient-ai",
    },
    {
      icon: Zap,
      label: "Today's Usage",
      value: summary.messages_sent.today,
      suffix: "msgs",
      accent: "bg-gradient-primary",
    },
    {
      icon: Activity,
      label: "Weekly Usage",
      value: summary.messages_sent.week,
      suffix: "msgs",
      accent: "bg-gradient-ai",
    },
    {
      icon: Database,
      label: "Monthly Usage",
      value: summary.messages_sent.month,
      suffix: "msgs",
      accent: "bg-gradient-primary",
    },
    {
      icon: Cloud,
      label: "Remaining Uploads Today",
      value: summary.remaining_uploads ?? 0,
      textValue: summary.remaining_uploads === null ? "Unlimited" : undefined,
      suffix: summary.remaining_uploads !== null ? "uploads" : undefined,
      subLabel:
        summary.remaining_uploads === null ? "Storage used: " + formatBytes(summary.storage_bytes) : undefined,
      accent: "bg-gradient-ai",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard key={card.label} {...card} delay={index * STAGGER_STEP} />
      ))}
    </div>
  );
}
