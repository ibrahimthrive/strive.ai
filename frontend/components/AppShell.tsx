"use client";

import Sidebar from "@/components/Sidebar";
import StriveSplash from "@/components/brand/StriveSplash";
import { useGlobalShortcuts } from "@/lib/useGlobalShortcuts";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isCheckingAuth } = useRequireAuth();
  useGlobalShortcuts();

  if (isCheckingAuth) {
    return <StriveSplash />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-deep-space">
      <Sidebar />
      {children}
    </div>
  );
}
