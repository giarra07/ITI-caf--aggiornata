import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useGame } from "@/game/GameContext";
import { playClick } from "@/game/audio";
import { Skull } from "lucide-react";

export const Route = createFileRoute("/game-over")({
  head: () => ({
    meta: [
      { title: "SGAMATO · The ITI Café" },
      { name: "description", content: "Schermata di game-over." },
    ],
  }),
  component: GameOverPage,
});

function GameOverPage() {
  const { state, resetAfterBust } = useGame();
  const router = useRouter();

  const restart = () => {
    playClick();
    resetAfterBust();
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative min-h-screen bg-silicon-black text-primary flex flex-col items-center justify-center px-4">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10 w-full max-w-md terminal-border bg-silicon-gray/70 rounded-sm p-6 space-y-4 font-mono text-center">
        <Skull size={48} className="mx-auto text-destructive text-glow-red animate-pulse" />
        <h1 className="text-3xl text-destructive text-glow-red">SGAMATO!</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          $ kernel.panic <span className="text-destructive">[FATAL]</span>
          <br />
          il preside ha trovato il tuo stash dentro il PC del laboratorio 3.
          <br />
          <span className="text-secondary">// the system remains secure</span>
        </p>
        <ul className="text-[11px] text-primary/90 space-y-1 text-left bg-silicon-black/60 p-3 rounded-sm">
          <li>
            // giorni sopravvissuti:{" "}
            <span className="text-secondary">{state.stats.daysSurvived}</span>
          </li>
          <li>
            // totale unità vendute: <span className="text-secondary">{state.stats.totalSold}</span>
          </li>
          <li>
            // CPN totali guadagnati:{" "}
            <span className="text-secondary">{state.stats.totalEarned}</span>
          </li>
          <li>
            // busts: <span className="text-destructive">{state.stats.busts + 1}</span>
          </li>
        </ul>
        <button
          onClick={restart}
          className="w-full rounded-sm border-2 border-primary bg-primary/10 px-3 py-2 text-xs uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
        >
          ./reboot.sh
        </button>
      </div>
    </div>
  );
}
