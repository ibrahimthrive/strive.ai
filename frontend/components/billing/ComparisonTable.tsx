import { Check, Minus } from "lucide-react";

interface ComparisonRow {
  label: string;
  free: boolean | string;
  pro: boolean | string;
  business: boolean | string;
}

const ROWS: ComparisonRow[] = [
  { label: "Daily messages", free: "20 / day", pro: "Unlimited", business: "Unlimited" },
  { label: "Model", free: "gpt-4o-mini", pro: "gpt-4o", business: "gpt-4o" },
  { label: "Conversation history & folders", free: true, pro: true, business: true },
  { label: "Priority support", free: false, pro: true, business: true },
  { label: "Business invoicing & receipts", free: false, pro: false, business: true },
  { label: "Dedicated account email", free: false, pro: false, business: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-sm text-ink-secondary">{value}</span>;
  return value ? (
    <Check size={16} className="text-neural-cyan" />
  ) : (
    <Minus size={16} className="text-ink-disabled" />
  );
}

export function ComparisonTable() {
  return (
    <div className="glass-panel overflow-x-auto rounded-2xl">
      <table className="w-full min-w-[480px] text-left">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-ink-disabled">
            <th className="px-4 py-3 font-medium">Feature</th>
            <th className="px-4 py-3 font-medium">Free</th>
            <th className="px-4 py-3 font-medium">Pro</th>
            <th className="px-4 py-3 font-medium">Business</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 text-sm text-ink-primary">{row.label}</td>
              <td className="px-4 py-3">
                <Cell value={row.free} />
              </td>
              <td className="px-4 py-3">
                <Cell value={row.pro} />
              </td>
              <td className="px-4 py-3">
                <Cell value={row.business} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
