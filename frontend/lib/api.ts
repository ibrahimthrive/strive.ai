import type { InvoiceOut, PaymentMethodOut, PlanOut, PlanTier, SubscriptionOut } from "@/types/billing";
import type { DashboardSummary } from "@/types/dashboard";
import type {
  ConversationOut,
  ConversationUpdatePatch,
  FolderOut,
  ListConversationsParams,
} from "@/types/history";
import type { ApiKeyCreateResponse, ApiKeyOut, ProfileOut } from "@/types/profile";
import type { ExportDataOut, UserSettingsOut, UserSettingsUpdatePatch } from "@/types/settings";
import type { SharedConversationOut } from "@/types/share";
import { clearSession } from "@/lib/storage";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function handleExpiredSession(): void {
  if (typeof window === "undefined") return;
  clearSession();
  if (window.location.pathname !== "/auth") {
    window.location.href = "/auth";
  }
}

/**
 * FastAPI error bodies are JSON (`{"detail": "..."}` for a plain HTTPException,
 * `{"detail": [{"msg": "...", ...}, ...]}` for a 422 validation error) — never
 * the raw text we want to show a user. Extract the readable message instead of
 * dumping the JSON envelope into the UI.
 */
async function extractErrorDetail(response: Response): Promise<string> {
  const fallback = response.clone();
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) {
      const messages = body.detail.map((item: { msg?: string }) => item?.msg).filter(Boolean);
      if (messages.length > 0) return messages.join(" ");
    }
  } catch {
    // body wasn't JSON — fall through to raw text below
  }
  const text = await fallback.text().catch(() => "");
  return text || response.statusText || "Request failed.";
}

async function apiRequest<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    handleExpiredSession();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  if (!response.ok) {
    throw new ApiError(await extractErrorDetail(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

interface StreamChatMessage {
  role: "user" | "assistant";
  content: string;
  image_data_url?: string;
}

export interface StreamChatParams {
  messages: StreamChatMessage[];
  accessToken: string;
  onToken: (token: string) => void;
  signal?: AbortSignal;
  conversationId?: string;
  conversationTitle?: string;
}

export async function streamChat({
  messages,
  accessToken,
  onToken,
  signal,
  conversationId,
  conversationTitle,
}: StreamChatParams): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messages,
      conversation_id: conversationId,
      conversation_title: conversationTitle,
    }),
    signal,
  });

  if (response.status === 401) {
    handleExpiredSession();
    throw new ApiError("Your session has expired. Please log in again.", 401);
  }

  if (!response.ok || !response.body) {
    throw new ApiError(await extractErrorDetail(response), response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) onToken(decoder.decode(value, { stream: true }));
  }
}

export async function fetchDashboardSummary(accessToken: string, signal?: AbortSignal): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>("/api/dashboard/summary", accessToken, { signal });
}

export async function fetchConversations(
  accessToken: string,
  params: ListConversationsParams = {},
  signal?: AbortSignal
): Promise<ConversationOut[]> {
  const search = new URLSearchParams();
  if (params.folderId) search.set("folder_id", params.folderId);
  if (params.view) search.set("view", params.view);
  if (params.q) search.set("q", params.q);
  if (params.sort) search.set("sort", params.sort);
  const query = search.toString();
  return apiRequest<ConversationOut[]>(`/api/conversations${query ? `?${query}` : ""}`, accessToken, { signal });
}

export async function updateConversation(
  accessToken: string,
  clientId: string,
  patch: ConversationUpdatePatch
): Promise<ConversationOut> {
  return apiRequest<ConversationOut>(`/api/conversations/${encodeURIComponent(clientId)}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteConversationRemote(accessToken: string, clientId: string): Promise<void> {
  await apiRequest<void>(`/api/conversations/${encodeURIComponent(clientId)}`, accessToken, { method: "DELETE" });
}

export async function fetchFolders(accessToken: string, signal?: AbortSignal): Promise<FolderOut[]> {
  return apiRequest<FolderOut[]>("/api/folders", accessToken, { signal });
}

export async function createFolder(accessToken: string, name: string): Promise<FolderOut> {
  return apiRequest<FolderOut>("/api/folders", accessToken, { method: "POST", body: JSON.stringify({ name }) });
}

export async function updateFolder(accessToken: string, folderId: string, name: string): Promise<FolderOut> {
  return apiRequest<FolderOut>(`/api/folders/${encodeURIComponent(folderId)}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolder(accessToken: string, folderId: string): Promise<void> {
  await apiRequest<void>(`/api/folders/${encodeURIComponent(folderId)}`, accessToken, { method: "DELETE" });
}

export async function fetchPlans(accessToken: string, signal?: AbortSignal): Promise<PlanOut[]> {
  return apiRequest<PlanOut[]>("/api/billing/plans", accessToken, { signal });
}

export async function createCheckoutSession(accessToken: string, tier: PlanTier): Promise<{ checkout_url: string }> {
  return apiRequest<{ checkout_url: string }>("/api/billing/checkout-session", accessToken, {
    method: "POST",
    body: JSON.stringify({ tier }),
  });
}

export async function createPortalSession(accessToken: string): Promise<{ portal_url: string }> {
  return apiRequest<{ portal_url: string }>("/api/billing/portal-session", accessToken, { method: "POST" });
}

export async function fetchSubscription(accessToken: string, signal?: AbortSignal): Promise<SubscriptionOut> {
  return apiRequest<SubscriptionOut>("/api/billing/subscription", accessToken, { signal });
}

export async function fetchInvoices(accessToken: string, signal?: AbortSignal): Promise<InvoiceOut[]> {
  return apiRequest<InvoiceOut[]>("/api/billing/invoices", accessToken, { signal });
}

export async function fetchPaymentMethods(accessToken: string, signal?: AbortSignal): Promise<PaymentMethodOut[]> {
  return apiRequest<PaymentMethodOut[]>("/api/billing/payment-methods", accessToken, { signal });
}

export async function cancelSubscription(accessToken: string): Promise<SubscriptionOut> {
  return apiRequest<SubscriptionOut>("/api/billing/cancel-subscription", accessToken, { method: "POST" });
}

export async function resumeSubscription(accessToken: string): Promise<SubscriptionOut> {
  return apiRequest<SubscriptionOut>("/api/billing/resume-subscription", accessToken, { method: "POST" });
}

export async function fetchProfile(accessToken: string, signal?: AbortSignal): Promise<ProfileOut> {
  return apiRequest<ProfileOut>("/api/profile", accessToken, { signal });
}

export async function updateProfile(accessToken: string, displayName: string | null): Promise<ProfileOut> {
  return apiRequest<ProfileOut>("/api/profile", accessToken, {
    method: "PATCH",
    body: JSON.stringify({ display_name: displayName }),
  });
}

export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiRequest<void>("/api/profile/change-password", accessToken, {
    method: "POST",
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

export async function fetchApiKeys(accessToken: string, signal?: AbortSignal): Promise<ApiKeyOut[]> {
  return apiRequest<ApiKeyOut[]>("/api/profile/api-keys", accessToken, { signal });
}

export async function createApiKey(accessToken: string, name: string): Promise<ApiKeyCreateResponse> {
  return apiRequest<ApiKeyCreateResponse>("/api/profile/api-keys", accessToken, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function revokeApiKey(accessToken: string, keyId: string): Promise<void> {
  await apiRequest<void>(`/api/profile/api-keys/${encodeURIComponent(keyId)}`, accessToken, { method: "DELETE" });
}

export async function deleteAccount(accessToken: string, password: string): Promise<void> {
  await apiRequest<void>("/api/profile", accessToken, {
    method: "DELETE",
    body: JSON.stringify({ password }),
  });
}

export async function fetchSettings(accessToken: string, signal?: AbortSignal): Promise<UserSettingsOut> {
  return apiRequest<UserSettingsOut>("/api/settings", accessToken, { signal });
}

export async function updateSettings(
  accessToken: string,
  patch: UserSettingsUpdatePatch
): Promise<UserSettingsOut> {
  return apiRequest<UserSettingsOut>("/api/settings", accessToken, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function exportData(accessToken: string): Promise<ExportDataOut> {
  return apiRequest<ExportDataOut>("/api/settings/export", accessToken);
}

export async function createShareLink(accessToken: string, clientId: string): Promise<{ share_token: string }> {
  return apiRequest<{ share_token: string }>(`/api/conversations/${encodeURIComponent(clientId)}/share`, accessToken, {
    method: "POST",
  });
}

export async function revokeShareLink(accessToken: string, clientId: string): Promise<void> {
  await apiRequest<void>(`/api/conversations/${encodeURIComponent(clientId)}/share`, accessToken, {
    method: "DELETE",
  });
}

export async function fetchSharedConversation(token: string): Promise<SharedConversationOut> {
  const response = await fetch(`${API_BASE_URL}/api/share/${encodeURIComponent(token)}`);
  if (!response.ok) {
    throw new ApiError(await extractErrorDetail(response), response.status);
  }
  return (await response.json()) as SharedConversationOut;
}
