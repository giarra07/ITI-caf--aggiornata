import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { useGame, formatMs } from "@/game/GameContext";
import { AppMenu } from "./AppMenu";
import { Breadcrumbs } from "./Breadcrumbs";
import { SuspicionMeter } from "./SuspicionMeter";

export function TerminalHeader() {
  const { state, msUntilNextDay } = useGame();
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-primary/40 bg-silicon-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2.5 font-mono text-xs">
        <AppMenu />
        <div className="min-w-0 flex-1">
          <p className="text-primary text-glow truncate">
            <span className="opacity-60">root@iti-cafe</span>:
            <span className="text-secondary">~/day{state.day}</span>$ <span className="caret" />
          </p>
          <p className="text-[10px] text-muted-foreground">
            {time.toLocaleTimeString("it-IT", { hour12: false })} · next day in{" "}
            <span className="text-secondary">{formatMs(msUntilNextDay)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-secondary text-glow-yellow">
            <Coins size={14} />
            <span className="tabular-nums font-bold">{state.coins}</span>
            <span className="text-[9px] uppercase opacity-70">CPN</span>
          </div>
          <SuspicionMeter value={state.suspicion} compact />
        </div>
      </div>
      <Breadcrumbs />
    </header>
  );
}
