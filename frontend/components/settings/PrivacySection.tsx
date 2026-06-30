import Link from "next/link";

import { FadeInSection } from "@/components/ui/FadeInSection";

export function PrivacySection() {
  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Privacy</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Your conversations are stored so you can search and revisit them later. You can export or permanently delete
        your data at any time.
      </p>
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-neural-cyan">
        <a href="#export-data" className="hover:underline">
          Export my data
        </a>
        <Link href="/profile#danger-zone" className="hover:underline">
          Delete my account
        </Link>
      </div>
    </FadeInSection>
  );
}
