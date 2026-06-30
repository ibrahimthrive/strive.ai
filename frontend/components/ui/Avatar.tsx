import StriveMark from "@/components/brand/StriveMark";

interface AvatarProps {
  variant: "user" | "assistant";
  email?: string;
  size?: number;
}

export function Avatar({ variant, email, size = 28 }: AvatarProps) {
  if (variant === "assistant") {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-full bg-graphite"
        style={{ width: size, height: size }}
      >
        <StriveMark size={size * 0.6} />
      </div>
    );
  }

  const initial = email?.trim().charAt(0).toUpperCase() || "U";

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-user-bubble text-xs font-semibold text-white"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
