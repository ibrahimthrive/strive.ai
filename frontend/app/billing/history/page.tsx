"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink } from "lucide-react";

import AppShell from "@/components/AppShell";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";
import { BillingTabs } from "@/components/billing/BillingTabs";
import { HistoryEmptyState } from "@/components/history/HistoryEmptyState";
import { ApiError, fetchInvoices } from "@/lib/api";
import { ConversationsProvider } from "@/lib/conversations-context";
import { STORAGE_KEYS } from "@/lib/storage";
import type { InvoiceOut } from "@/types/billing";

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(
    cents / 100
  );
}

function statusTone(status: string | null): string {
  if (status === "paid") return "text-success";
  if (status === "open") return "text-warning";
  return "text-ink-disabled";
}

function BillingHistoryContent() {
  const [invoices, setInvoices] = useState<InvoiceOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = window.localStorage.getItem(STORAGE_KEYS.accessToken);
    if (!accessToken) return;
    fetchInvoices(accessToken)
      .then(setInvoices)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Couldn't load billing history."));
  }, []);

  return (
    <div className="scroll-thin h-full flex-1 overflow-y-auto p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">Billing History</h1>
          <p className="text-sm text-ink-muted">Every invoice generated for your account.</p>
        </div>

        <BillingTabs />

        {error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : invoices === null ? (
          <BillingSkeleton />
        ) : invoices.length === 0 ? (
          <HistoryEmptyState message="No invoices yet. They'll show up here after your first payment." />
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="glass-panel flex items-center justify-between gap-3 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-primary">
                    {formatAmount(invoice.amount_paid, invoice.currency)}
                  </p>
                  <p className="text-[11px] text-ink-disabled">{new Date(invoice.created).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-medium uppercase ${statusTone(invoice.status)}`}>
                  {invoice.status ?? "unknown"}
                </span>
                <div className="flex items-center gap-2">
                  {invoice.hosted_invoice_url && (
                    <a
                      href={invoice.hosted_invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="View invoice"
                      className="rounded-md p-1.5 text-ink-disabled transition hover:bg-graphite hover:text-ink-secondary"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {invoice.invoice_pdf && (
                    <a
                      href={invoice.invoice_pdf}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Download invoice PDF"
                      className="rounded-md p-1.5 text-ink-disabled transition hover:bg-graphite hover:text-ink-secondary"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillingHistoryPage() {
  return (
    <ConversationsProvider>
      <AppShell>
        <main className="flex flex-1 flex-col overflow-hidden">
          <BillingHistoryContent />
        </main>
      </AppShell>
    </ConversationsProvider>
  );
}
