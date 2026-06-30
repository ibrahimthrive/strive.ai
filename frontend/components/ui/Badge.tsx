interface BadgeProps {
  tone: "free" | "pro" | "business" | "neutral";
  children: React.ReactNode;
}

const TONE_CLASSES: Record<BadgeProps["tone"], string> = {
  free: "bg-graphite text-ink-muted",
  pro: "bg-gradient-ai text-white",
  business: "bg-gradient-primary text-white",
  neutral: "border border-white/10 text-ink-secondary",
};

export function Badge({ tone, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
