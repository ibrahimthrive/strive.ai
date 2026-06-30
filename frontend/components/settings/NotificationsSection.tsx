"use client";

import { FadeInSection } from "@/components/ui/FadeInSection";
import { Switch } from "@/components/ui/Switch";

interface NotificationsSectionProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function NotificationsSection({ enabled, onChange }: NotificationsSectionProps) {
  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Notifications</h2>
      <div className="mt-4">
        <Switch label="Email notifications" checked={enabled} onChange={onChange} />
        <p className="mt-2 text-xs text-ink-disabled">
          Your preference is saved, but email delivery isn&apos;t enabled yet — nothing will be sent to your inbox
          right now.
        </p>
      </div>
    </FadeInSection>
  );
}
