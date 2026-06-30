export const STORAGE_KEYS = {
  accessToken: "strive_access_token",
  user: "strive_user",
  conversations: "strive_conversations",
  sidebarCollapsed: "strive_sidebar_collapsed",
  theme: "strive_theme",
} as const;

export function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode, quota) — fail silently, app still works in-memory
  }
}

export function removeKey(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

/**
 * Clears everything tied to the signed-in identity (auth + locally cached
 * conversations). Must run on logout, on a fresh login/register, and on a
 * forced session expiry — otherwise a different account signing in on the
 * same browser inherits the previous account's local chat cache.
 */
export function clearSession(): void {
  removeKey(STORAGE_KEYS.accessToken);
  removeKey(STORAGE_KEYS.user);
  removeKey(STORAGE_KEYS.conversations);
}
