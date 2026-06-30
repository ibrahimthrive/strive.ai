"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AppShell from "@/components/AppShell";
import { ApiKeysSection } from "@/components/profile/ApiKeysSection";
import { ConnectedAccountsSection } from "@/components/profile/ConnectedAccountsSection";
import { DangerZoneSection } from "@/components/profile/DangerZoneSection";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { SecuritySection } from "@/components/profile/SecuritySection";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ApiError,
  changePassword,
  createApiKey,
  deleteAccount,
  fetchApiKeys,
  fetchProfile,
  revokeApiKey,
  updateProfile,
} from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { clearSession, readJSON, STORAGE_KEYS, writeJSON } from "@/lib/storage";
import type { StoredUser } from "@/types/chat";
import type { ApiKeyOut, ProfileOut } from "@/types/profile";

function ProfileSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const { push } = useToast();
  const [profile, setProfile] = useState<ProfileOut | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    Promise.all([fetchProfile(accessToken), fetchApiKeys(accessToken)])
      .then(([profileResult, apiKeysResult]) => {
        setProfile(profileResult);
        setApiKeys(apiKeysResult);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load your profile.");
      });
  }, []);

  useEffect(() => reload(), [reload]);

  async function handleSaveDisplayName(displayName: string) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    const updated = await updateProfile(accessToken, displayName || null);
    setProfile(updated);
    const storedUser = readJSON<StoredUser>(STORAGE_KEYS.user);
    if (storedUser) writeJSON(STORAGE_KEYS.user, { ...storedUser, display_name: updated.display_name });
    push("Display name updated.", "success");
  }

  async function handleChangePassword(currentPassword: string, newPassword: string) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    await changePassword(accessToken, currentPassword, newPassword);
  }

  async function handleCreateApiKey(name: string) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) throw new Error("Not signed in.");
    const created = await createApiKey(accessToken, name);
    setApiKeys((prev) => [created, ...(prev ?? [])]);
    return created;
  }

  async function handleRevokeApiKey(id: string) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    await revokeApiKey(accessToken, id);
    setApiKeys((prev) => prev?.map((key) => (key.id === id ? { ...key, revoked_at: new Date().toISOString() } : key)) ?? null);
  }

  async function handleDeleteAccount(password: string) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    await deleteAccount(accessToken, password);
    clearSession();
    router.push("/auth");
  }

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Profile</h1>
          <p className="text-sm text-ink-muted">Manage your account, API keys, and security.</p>
        </div>

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : profile === null || apiKeys === null ? (
          <ProfileSkeleton />
        ) : (
          <>
            <ProfileHeader profile={profile} onSaveDisplayName={handleSaveDisplayName} />
            <ApiKeysSection apiKeys={apiKeys} onCreate={handleCreateApiKey} onRevoke={handleRevokeApiKey} />
            <ConnectedAccountsSection />
            <SecuritySection onChangePassword={handleChangePassword} />
            <DangerZoneSection onDeleteAccount={handleDeleteAccount} />
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <ProfileContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
