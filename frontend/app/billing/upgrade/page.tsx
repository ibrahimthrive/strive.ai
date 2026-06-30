"use client";

import { useCallback, useEffect, useState } from "react";

import AppShell from "@/components/AppShell";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";
import { BillingTabs } from "@/components/billing/BillingTabs";
import { ComparisonTable } from "@/components/billing/ComparisonTable";
import { PlanCard } from "@/components/billing/PlanCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, cancelSubscription, createCheckoutSession, fetchPlans, fetchSubscription } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { readJSON, STORAGE_KEYS } from "@/lib/storage";
import type { StoredUser } from "@/types/chat";
import type { PlanOut, PlanTier, SubscriptionOut } from "@/types/billing";

function UpgradeContent() {
  const { push } = useToast();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [plans, setPlans] = useState<PlanOut[] | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoadingTier, setCheckoutLoadingTier] = useState<PlanTier | null>(null);
  const [confirmDowngrade, setConfirmDowngrade] = useState(false);

  const reload = useCallback(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    Promise.all([fetchPlans(accessToken), fetchSubscription(accessToken)])
      .then(([plansResult, subscriptionResult]) => {
        setPlans(plansResult);
        setSubscription(subscriptionResult);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load plans right now.");
      });
  }, []);

  useEffect(() => {
    setUser(readJSON<StoredUser>(STORAGE_KEYS.user));
    reload();
  }, [reload]);

  async function handleUpgrade(tier: PlanTier) {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    setCheckoutLoadingTier(tier);
    try {
      const { checkout_url } = await createCheckoutSession(accessToken, tier);
      window.location.href = checkout_url;
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't start checkout. Please try again.", "error");
      setCheckoutLoadingTier(null);
    }
  }

  async function handleConfirmDowngrade() {
    setConfirmDowngrade(false);
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    try {
      const updated = await cancelSubscription(accessToken);
      setSubscription(updated);
      push("Your plan will downgrade to Free at the end of the billing period.", "success");
    } catch (err) {
      push(err instanceof ApiError ? err.message : "Couldn't update your subscription.", "error");
    }
  }

  function ctaFor(plan: PlanOut): { label: string; disabled: boolean } {
    const isCurrent = user?.tier === plan.tier;
    if (isCurrent) return { label: "Current plan", disabled: true };
    if (plan.tier === "free") {
      if (subscription?.cancel_at_period_end) return { label: "Downgrade scheduled", disabled: true };
      return { label: "Downgrade", disabled: false };
    }
    return { label: "Upgrade", disabled: false };
  }

  function handleSelect(plan: PlanOut) {
    if (user?.tier === plan.tier) return;
    if (plan.tier === "free") {
      setConfirmDowngrade(true);
      return;
    }
    void handleUpgrade(plan.tier);
  }

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Plans &amp; Pricing</h1>
          <p className="text-sm text-ink-muted">Pick the plan that fits how you use Strive.</p>
        </div>

        <BillingTabs />

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : plans === null ? (
          <BillingSkeleton rows={1} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {plans.map((plan, index) => {
                const cta = ctaFor(plan);
                return (
                  <PlanCard
                    key={plan.tier}
                    plan={plan}
                    isCurrent={user?.tier === plan.tier}
                    popular={plan.tier === "pro"}
                    ctaLabel={cta.label}
                    ctaDisabled={cta.disabled}
                    ctaLoading={checkoutLoadingTier === plan.tier}
                    onSelect={() => handleSelect(plan)}
                    delay={index * 0.06}
                  />
                );
              })}
            </div>

            <ComparisonTable />
          </>
        )}
      </div>

      <Modal open={confirmDowngrade} onClose={() => setConfirmDowngrade(false)} title="Downgrade to Free?">
        <p className="mb-5 text-sm text-ink-muted">
          You&apos;ll keep your current plan&apos;s features until the end of the billing period, then move to Free.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirmDowngrade(false)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={() => void handleConfirmDowngrade()}>
            Downgrade
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <UpgradeContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
