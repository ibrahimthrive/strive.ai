"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { useToast } from "@/components/ui/ToastProvider";
import type { ExportDataOut } from "@/types/settings";

interface ExportDataSectionProps {
  onExport: () => Promise<ExportDataOut>;
}

export function ExportDataSection({ onExport }: ExportDataSectionProps) {
  const { push } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const data = await onExport();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "strive-data-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      push("Couldn't export your data. Please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <FadeInSection id="export-data" className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Export Data</h2>
      <p className="mt-2 text-xs text-ink-disabled">
        Download a JSON file containing your profile and every conversation in your account.
      </p>
      <Button variant="secondary" size="sm" className="mt-3" disabled={exporting} onClick={() => void handleExport()}>
        {exporting ? "Preparing export..." : "Export my data"}
      </Button>
    </FadeInSection>
  );
}
