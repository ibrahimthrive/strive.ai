interface GlassPanelProps {
  className?: string;
  children: React.ReactNode;
}

export function GlassPanel({ className, children }: GlassPanelProps) {
  return <div className={`glass-panel rounded-2xl ${className ?? ""}`}>{children}</div>;
}
