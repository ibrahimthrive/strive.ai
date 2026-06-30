"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";

import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { ConversationsProvider } from "@/lib/conversations-context";

function CancelContent() {
  return (
    <div className="flex h-full flex-1 items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="glass-panel max-w-md rounded-2xl p-8 text-center"
      >
        <XCircle size={40} className="mx-auto text-ink-disabled" />
        <h1 className="mt-4 text-lg font-semibold text-ink-primary">Checkout canceled</h1>
        <p className="mt-2 text-sm text-ink-muted">No worries — your plan hasn&apos;t changed. Come back anytime.</p>
        <Link href="/billing/upgrade">
          <Button variant="primary" className="mt-6">
            Back to plans
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}

export default function BillingCancelPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <CancelContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
