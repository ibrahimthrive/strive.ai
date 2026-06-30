"use client";

import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";

import AppShell from "@/components/AppShell";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";
import { BillingTabs } from "@/components/billing/BillingTabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { HistoryEmptyState } from "@/components/history/HistoryEmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, createPortalSession, fetchPaymentMethods } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { STORAGE_KEYS } from "@/lib/storage";
import type { PaymentMethodOut } from "@/types/billing";

function PaymentMethodsContent() {
  const { push } = useToast();
  const [methods, setMethods] = useState<PaymentMethodOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    fetchPaymentMethods(accessToken)
      .then(setMethods)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Couldn't load payment methods."));
  }, []);

  async function handleManage() {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    setPortalLoading(true);
    try {
      const { portal_url } = await createPortalSession(accessToken);
      window.location.href = portal_url;
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't open the billing portal.", "error");
      setPortalLoading(false);
    }
  }

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink-primary">Payment Methods</h1>
            <p className="text-sm text-ink-muted">Cards on file for your subscription.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => void handleManage()} disabled={portalLoading}>
            {portalLoading ? "Opening..." : "Manage payment methods"}
          </Button>
        </div>

        <BillingTabs />

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : methods === null ? (
          <BillingSkeleton rows={2} />
        ) : methods.length === 0 ? (
          <HistoryEmptyState message="No payment methods on file yet. Add one from the billing portal." />
        ) : (
          <div className="space-y-2">
            {methods.map((method) => (
              <div key={method.id} className="glass-panel flex items-center gap-3 rounded-xl px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-graphite text-ink-secondary">
                  <CreditCard size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-primary">
                    {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} &middot; &bull;&bull;&bull;&bull;{" "}
                    {method.last4}
                  </p>
                  <p className="text-[11px] text-ink-disabled">
                    Expires {String(method.exp_month).padStart(2, "0")}/{method.exp_year}
                  </p>
                </div>
                {method.is_default && <Badge tone="neutral">Default</Badge>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentMethodsPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <PaymentMethodsContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
