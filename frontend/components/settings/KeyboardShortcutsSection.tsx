import { FadeInSection } from "@/components/ui/FadeInSection";

const SHORTCUTS = [
  { keys: "Alt + N", description: "Start a new chat" },
  { keys: "Alt + D", description: "Go to Dashboard" },
  { keys: "Alt + H", description: "Go to History" },
];

export function KeyboardShortcutsSection() {
  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Keyboard Shortcuts</h2>
      <ul className="mt-3 space-y-2">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.keys} className="flex items-center justify-between text-sm">
            <span className="text-ink-secondary">{shortcut.description}</span>
            <kbd className="rounded-md border border-white/10 bg-deep-space/60 px-2 py-1 text-xs text-ink-muted">
              {shortcut.keys}
            </kbd>
          </li>
        ))}
      </ul>
    </FadeInSection>
  );
}
