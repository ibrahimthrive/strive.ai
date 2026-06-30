"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { fetchSubscription } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { readJSON, STORAGE_KEYS, writeJSON } from "@/lib/storage";
import { tierLabel } from "@/lib/tier";
import type { StoredUser } from "@/types/chat";
import type { PlanTier } from "@/types/billing";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 10000;

function SuccessContent() {
  const [status, setStatus] = useState<"polling" | "confirmed" | "timeout">("polling");
  const [newTier, setNewTier] = useState<PlanTier | null>(null);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    const token: string = accessToken;
    const storedUser = readJSON<StoredUser>(STORAGE_KEYS.user);
    const previousTier = storedUser?.tier ?? "free";

    let cancelled = false;
    async function poll() {
      try {
        const subscription = await fetchSubscription(token);
        if (cancelled) return;
        if (subscription.tier !== previousTier) {
          if (storedUser) writeJSON(STORAGE_KEYS.user, { ...storedUser, tier: subscription.tier });
          setNewTier(subscription.tier);
          setStatus("confirmed");
          return;
        }
      } catch {
        // ignore transient errors while polling; we retry until the timeout below
      }

      if (Date.now() - startedAtRef.current >= POLL_TIMEOUT_MS) {
        setStatus("timeout");
        return;
      }
      setTimeout(() => void poll(), POLL_INTERVAL_MS);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-full flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="glass-panel max-w-md rounded-2xl p-8 text-center"
      >
        {status === "polling" && (
          <>
            <Spinner size={28} />
            <p className="mt-4 text-sm text-ink-muted">Confirming your upgrade...</p>
          </>
        )}
        {status === "confirmed" && (
          <>
            <CheckCircle2 size={40} className="mx-auto text-success" />
            <h1 className="mt-4 text-lg font-semibold text-ink-primary">
              You&apos;re now on the {tierLabel(newTier ?? undefined)} plan!
            </h1>
            <p className="mt-2 text-sm text-ink-muted">Thanks for upgrading. Enjoy everything Strive has to offer.</p>
            <Link href="/dashboard">
              <Button variant="primary" className="mt-6">
                Go to dashboard
              </Button>
            </Link>
          </>
        )}
        {status === "timeout" && (
          <>
            <Spinner size={28} />
            <h1 className="mt-4 text-lg font-semibold text-ink-primary">Still processing...</h1>
            <p className="mt-2 text-sm text-ink-muted">
              Your payment went through. It can take a minute for your plan to update — check back shortly.
            </p>
            <Link href="/billing/manage">
              <Button variant="secondary" className="mt-6">
                View billing
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <SuccessContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
