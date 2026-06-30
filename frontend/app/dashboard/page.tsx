"use client";

import { useEffect, useState } from "react";

import AppShell from "@/components/AppShell";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { AnalyticsGrid } from "@/components/dashboard/AnalyticsGrid";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { UsageChart } from "@/components/dashboard/UsageChart";
import { WelcomeSection } from "@/components/dashboard/WelcomeSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError, fetchDashboardSummary } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { readJSON, STORAGE_KEYS } from "@/lib/storage";
import type { StoredUser } from "@/types/chat";
import type { DashboardSummary } from "@/types/dashboard";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

function DashboardContent() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUser(readJSON<StoredUser>(STORAGE_KEYS.user));

    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;

    const controller = new AbortController();
    fetchDashboardSummary(accessToken, controller.signal)
      .then(setSummary)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard. Please try again.");
      });

    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-6">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!summary) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <WelcomeSection user={user} />
        <QuickActions />
        <AnalyticsGrid summary={summary} />
        <div className="grid gap-3 lg:grid-cols-2">
          <UsageChart title="This Week" data={summary.weekly_series} accent="bg-gradient-primary" />
          <UsageChart title="Last 6 Months" data={summary.monthly_series} accent="bg-gradient-ai" />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <RecentConversations conversations={summary.recent_conversations} />
          <ActivityTimeline activity={summary.activity} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <DashboardContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
