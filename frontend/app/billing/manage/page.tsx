"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import AppShell from "@/components/AppShell";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";
import { BillingTabs } from "@/components/billing/BillingTabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, cancelSubscription, createPortalSession, fetchSubscription, resumeSubscription } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { STORAGE_KEYS } from "@/lib/storage";
import { tierBadgeTone, tierLabel } from "@/lib/tier";
import type { SubscriptionOut } from "@/types/billing";

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function ManageContent() {
  const { push } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const reload = useCallback(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    fetchSubscription(accessToken)
      .then((result) => {
        setSubscription(result);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load your subscription.");
      });
  }, []);

  useEffect(() => reload(), [reload]);

  async function handleManageBilling() {
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

  async function handleCancel() {
    setConfirmCancel(false);
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    try {
      setSubscription(await cancelSubscription(accessToken));
      push("Your subscription will end at the close of the current billing period.", "success");
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't cancel your subscription.", "error");
    }
  }

  async function handleResume() {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    try {
      setSubscription(await resumeSubscription(accessToken));
      push("Your subscription will continue renewing.", "success");
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't resume your subscription.", "error");
    }
  }

  const periodEnd = formatDate(subscription?.current_period_end ?? null);
  const isPaid = subscription !== null && subscription.tier !== "free" && subscription.status !== "none";

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Billing</h1>
          <p className="text-sm text-ink-muted">Manage your plan, payment methods, and billing history.</p>
        </div>

        <BillingTabs />

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : subscription === null ? (
          <BillingSkeleton rows={1} />
        ) : (
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone={tierBadgeTone(subscription.tier)}>{tierLabel(subscription.tier)} plan</Badge>
                <p className="mt-2 text-sm text-ink-muted">
                  {subscription.status === "none" && "You're on the Free plan."}
                  {subscription.status !== "none" && subscription.cancel_at_period_end && periodEnd && (
                    <>Cancels on {periodEnd}.</>
                  )}
                  {subscription.status !== "none" && !subscription.cancel_at_period_end && periodEnd && (
                    <>Renews on {periodEnd}.</>
                  )}
                </p>
              </div>
              <Link href="/billing/upgrade">
                <Button variant="secondary" size="sm">
                  Change plan
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-5">
              <Button variant="primary" size="sm" onClick={() => void handleManageBilling()} disabled={portalLoading}>
                {portalLoading ? "Opening..." : "Manage billing & payment methods"}
              </Button>
              {isPaid && !subscription.cancel_at_period_end && (
                <Button variant="danger" size="sm" onClick={() => setConfirmCancel(true)}>
                  Cancel subscription
                </Button>
              )}
              {isPaid && subscription.cancel_at_period_end && (
                <Button variant="secondary" size="sm" onClick={() => void handleResume()}>
                  Resume subscription
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel subscription?">
        <p className="mb-5 text-sm text-ink-muted">
          You&apos;ll keep access until the end of the current billing period, then move to the Free plan.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmCancel(false)}>
            Keep subscription
          </Button>
          <Button variant="danger" size="sm" onClick={() => void handleCancel()}>
            Cancel subscription
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function ManageBillingPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <ManageContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
