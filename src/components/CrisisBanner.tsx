import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useGame } from "@/game/GameContext";

/** Avviso giallo quando il sospetto si avvicina al pericolo (PRD §7 — Crisis Management). */
export function CrisisBanner() {
  const { state } = useGame();
  const v = state.suspicion;

  if (state.gameOver || v < 75 || v >= 100) return null;

  return (
    <div className="terminal-border rounded-sm border-secondary/70 bg-secondary/10 p-2.5 font-mono text-[11px] animate-pulse">
      <p className="flex items-center gap-2 text-secondary text-glow-yellow">
        <AlertTriangle size={14} />
        <span>
          [warn] sospetto {Math.round(v)}%{v >= 90 ? " — RAID IMMINENTE" : " — preparati al raid"}.
          Nascondi lo stock in{" "}
          <Link to="/inventory" className="underline text-primary hover:text-glow">
            Inventory
          </Link>
        </span>
      </p>
    </div>
  );
}
