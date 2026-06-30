"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, History, LayoutGrid, Wallet } from "lucide-react";

const TABS = [
  { href: "/billing/manage", label: "Overview", icon: LayoutGrid },
  { href: "/billing/upgrade", label: "Plans", icon: CreditCard },
  { href: "/billing/history", label: "Billing History", icon: History },
  { href: "/billing/payment-methods", label: "Payment Methods", icon: Wallet },
];

export function BillingTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-white/10 bg-deep-space/40 p-1">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              isActive ? "bg-graphite text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
            }`}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
