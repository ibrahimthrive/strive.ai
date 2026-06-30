import { FadeInSection } from "@/components/ui/FadeInSection";

export function LanguageSection() {
  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Language</h2>
      <select
        disabled
        defaultValue="en"
        aria-label="Language"
        className="mt-3 w-48 rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-disabled"
      >
        <option value="en">English</option>
      </select>
      <p className="mt-2 text-xs text-ink-disabled">More languages are coming soon.</p>
    </FadeInSection>
  );
}
