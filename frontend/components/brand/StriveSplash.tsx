import StriveMarkAnimated from "@/components/brand/StriveMarkAnimated";

export default function StriveSplash() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-gradient-app">
      <StriveMarkAnimated size={64} loop />
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-ink-disabled">Strive</p>
    </div>
  );
}
