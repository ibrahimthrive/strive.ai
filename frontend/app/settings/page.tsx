"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/AppShell";
import { AIPreferencesSection } from "@/components/settings/AIPreferencesSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";
import { DeveloperOptionsSection } from "@/components/settings/DeveloperOptionsSection";
import { ExportDataSection } from "@/components/settings/ExportDataSection";
import { GeneralSection } from "@/components/settings/GeneralSection";
import { KeyboardShortcutsSection } from "@/components/settings/KeyboardShortcutsSection";
import { LanguageSection } from "@/components/settings/LanguageSection";
import { NotificationsSection } from "@/components/settings/NotificationsSection";
import { PrivacySection } from "@/components/settings/PrivacySection";
import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, exportData, fetchSettings, updateSettings } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { readJSON, STORAGE_KEYS } from "@/lib/storage";
import type { StoredUser } from "@/types/chat";
import type { UserSettingsOut } from "@/types/settings";

function SettingsSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function SettingsContent() {
  const { push } = useToast();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [settings, setSettings] = useState<UserSettingsOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    fetchSettings(accessToken)
      .then((result) => {
        setSettings(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load your settings.");
      });
  }, []);

  useEffect(() => {
    setUser(readJSON<StoredUser>(STORAGE_KEYS.user));
    reload();
  }, [reload]);

  function handleThemeChange(theme: "dark" | "light") {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    updateSettings(accessToken, { theme }).catch(() => {
      // best-effort: the theme preference is already saved locally regardless of backend sync outcome
    });
  }

  async function handleNotificationsChange(enabled: boolean) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    try {
      const updated = await updateSettings(accessToken, { email_notifications_enabled: enabled });
      setSettings(updated);
    } catch {
      push("Couldn't update that preference. Please try again.", "error");
    }
  }

  async function handleSaveInstructions(customInstructions: string) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    try {
      const updated = await updateSettings(accessToken, { custom_instructions: customInstructions || null });
      setSettings(updated);
      push("AI preferences saved.", "success");
    } catch {
      push("Couldn't save your instructions. Please try again.", "error");
    }
  }

  async function handleExport() {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) throw new Error("Not signed in.");
    return exportData(accessToken);
  }

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Settings</h1>
          <p className="text-sm text-ink-muted">Manage how Strive looks, behaves, and talks to you.</p>
        </div>

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : settings === null ? (
          <SettingsSkeleton />
        ) : (
          <>
            <GeneralSection user={user} />
            <AppearanceSection onThemeChange={handleThemeChange} />
            <NotificationsSection
              enabled={settings.email_notifications_enabled}
              onChange={(enabled) => void handleNotificationsChange(enabled)}
            />
            <PrivacySection />
            <AIPreferencesSection
              customInstructions={settings.custom_instructions}
              onSave={handleSaveInstructions}
            />
            <LanguageSection />
            <KeyboardShortcutsSection />
            <DeveloperOptionsSection />
            <ExportDataSection onExport={handleExport} />

            <FadeInSection id="danger-zone" className="glass-panel rounded-2xl border border-danger/20 p-6">
              <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
              <p className="mt-1 text-xs text-ink-disabled">
                Account deletion lives on your Profile page, alongside the rest of your account security.
              </p>
              <Link href="/profile#danger-zone">
                <Button variant="danger" size="sm" className="mt-3">
                  Delete account
                </Button>
              </Link>
            </FadeInSection>
          </>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <SettingsContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
