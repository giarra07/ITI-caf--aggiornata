import { useEffect, useState } from "react";
import { useGame, DAILY_ALLOWANCE } from "@/game/GameContext";
import { getLastDayNotice, setLastDayNotice } from "@/game/userFlow";
import { Coins, X } from "lucide-react";

/** Banner paghetta + evento all'avvio di un nuovo giorno (PRD §7). */
export function DayNotice() {
  const { state } = useGame();
  const [dismissed, setDismissed] = useState(false);

  const show = !dismissed && state.day > 1 && getLastDayNotice() < state.day;

  useEffect(() => {
    if (show) setLastDayNotice(state.day);
  }, [show, state.day]);

  if (!show) return null;

  return (
    <div
      role="status"
      className="terminal-border rounded-sm border-secondary/50 bg-secondary/10 p-3 font-mono text-xs"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-secondary text-glow-yellow flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <Coins size={14} /> giorno {state.day} iniziato
          </p>
          <p className="text-primary">+{DAILY_ALLOWANCE} CoperniCoin (paghetta)</p>
          {state.event && (
            <p className="text-muted-foreground">
              [event] <span className="text-secondary">{state.event.title}</span> —{" "}
              {state.event.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-primary"
          aria-label="Chiudi"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
