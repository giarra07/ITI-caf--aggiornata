import { Bell } from "lucide-react";

interface Props {
  value: number; // 0..100
  compact?: boolean;
}

export function SuspicionMeter({ value, compact }: Props) {
  const v = Math.max(0, Math.min(100, value));
  const tone =
    v < 40
      ? "text-primary"
      : v < 75
        ? "text-secondary text-glow-yellow"
        : "text-destructive text-glow-red";
  const barColor = v < 40 ? "bg-primary" : v < 75 ? "bg-secondary" : "bg-destructive";

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${tone}`} title={`Sospetto ${Math.round(v)}%`}>
        <Bell
          size={14}
          fill={v >= 75 ? "currentColor" : "none"}
          className={v >= 90 ? "animate-pulse" : undefined}
        />
        <span className="tabular-nums font-mono text-xs">{Math.round(v)}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>sospetto.bar</span>
        <span className={tone}>{Math.round(v)}% / 100%</span>
      </div>
      <div className="relative h-2.5 rounded-sm border border-primary/40 bg-card overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-500`}
          style={{ width: `${v}%` }}
        />
        {/* Soglia campanella */}
        <div className="absolute inset-y-0 right-0 w-px bg-destructive/80" />
      </div>
      <div className={`flex items-center justify-end gap-1 ${tone}`}>
        <Bell
          size={12}
          fill={v >= 75 ? "currentColor" : "none"}
          className={v >= 90 ? "animate-pulse" : undefined}
        />
        <span className="text-[10px] font-mono">
          {v >= 90 ? "RING RING!" : v >= 75 ? "danger" : v >= 40 ? "watch" : "calmo"}
        </span>
      </div>
    </div>
  );
}
