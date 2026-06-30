import StriveMarkAnimated from "@/components/brand/StriveMarkAnimated";

export function Spinner({ size = 16 }: { size?: number }) {
  return <StriveMarkAnimated size={size} loop />;
}
