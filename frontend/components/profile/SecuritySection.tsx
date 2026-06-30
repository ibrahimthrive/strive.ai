"use client";

import { useEffect, useState } from "react";
import { Laptop, Shield } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { FadeInSection } from "@/components/ui/FadeInSection";
import { Switch } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/ToastProvider";

interface SecuritySectionProps {
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function SecuritySection({ onChangePassword }: SecuritySectionProps) {
  const { push } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);

  useEffect(() => {
    setDeviceInfo(navigator.userAgent);
  }, []);

  async function handleSubmit() {
    if (newPassword.length < 8) {
      push("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      push("New passwords don't match.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      push("Password updated.", "success");
    } catch (err) {
      push(err instanceof Error ? err.message : "Couldn't update your password.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FadeInSection className="glass-panel rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-ink-primary">Security</h2>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="mt-4 space-y-3"
      >
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Current password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="New password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          className="w-full rounded-lg border border-white/10 bg-deep-space/40 px-3 py-2 text-sm text-ink-primary placeholder:text-ink-disabled focus:border-neural-cyan/40 focus:outline-none"
        />
        <Button type="submit" variant="primary" size="sm" disabled={submitting}>
          {submitting ? "Updating..." : "Update password"}
        </Button>
      </form>

      <div className="mt-6 border-t border-white/5 pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-disabled">Sessions</p>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/5 px-3 py-2.5">
          <Laptop size={16} className="text-ink-disabled" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-secondary">This device</p>
            <p className="truncate text-[11px] text-ink-disabled">{deviceInfo ?? "Loading..."}</p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-ink-disabled">Viewing and signing out other sessions is coming soon.</p>
      </div>

      <div className="mt-6 border-t border-white/5 pt-5">
        <Switch label="Two-factor authentication" checked={false} onChange={() => push("Coming soon", "default")} />
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-ink-disabled">
          <Shield size={12} /> 2FA is on the way — your account will get an extra layer of protection soon.
        </p>
      </div>
    </FadeInSection>
  );
}
