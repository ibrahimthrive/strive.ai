import StriveMark from "@/components/brand/StriveMark";

interface StriveLockupProps {
  size?: number;
  className?: string;
}

export default function StriveLockup({ size = 28, className }: StriveLockupProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <StriveMark size={size} />
      <span className="bg-gradient-ai bg-clip-text text-lg font-semibold tracking-tight text-transparent">
        Strive
      </span>
    </div>
  );
}
