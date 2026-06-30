import EmptyStateIllustration from "@/components/brand/EmptyStateIllustration";

export function HistoryEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 py-16 text-center">
      <EmptyStateIllustration />
      <p className="text-sm text-ink-muted">{message}</p>
    </div>
  );
}
