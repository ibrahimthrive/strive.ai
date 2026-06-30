"use client";

import { useState } from "react";

import { FadeInSection } from "@/components/ui/FadeInSection";
import { Switch } from "@/components/ui/Switch";
import { readJSON, STORAGE_KEYS, writeJSON } from "@/lib/storage";

interface AppearanceSectionProps {
  onThemeChange: (theme: "dark" | "light") => void;
}

export function AppearanceSection({ onThemeChange }: AppearanceSectionProps) {
  const [darkMode, setDarkMode] = useState(() => readJSON<string>(STORAGE_KEYS.theme) !== "light");

  function handleChange(checked: boolean) {
    setDarkMode(checked);
    const theme = checked ? "dark" : "light";
    writeJSON(STORAGE_KEYS.theme, theme);
    onThemeChange(theme);
  }

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Appearance</h2>
      <div className="mt-4">
        <Switch label="Dark theme" checked={darkMode} onChange={handleChange} />
        <p className="mt-2 text-xs text-ink-disabled">More settings, including a full light theme, are on the way.</p>
      </div>
    </FadeInSection>
  );
}
