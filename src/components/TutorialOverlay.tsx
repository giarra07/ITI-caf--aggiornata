import { useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { completeTutorial, isTutorialComplete } from "@/game/userFlow";
import { DAILY_ALLOWANCE } from "@/game/GameContext";
import { playClick } from "@/game/audio";

const STEPS = [
  {
    title: "// benvenuto nel terminale",
    body: "Sei un imprenditore studentesco all'ITI Copernico. Gestisci il coffee shop clandestino senza farti sgamare.",
  },
  {
    title: "// CoperniCoin",
    body: `Ogni giorno scolastico (10 min reali) ricevi +${DAILY_ALLOWANCE} CPN di paghetta. Compra stock nello Shop e rivendi via Pizzini.exe o Micro-missioni.`,
  },
  {
    title: "// campanella · sospetto",
    body: "Ogni vendita e acquisto aumenta il sospetto. Sotto il 75% sei relativamente al sicuro; oltre il 90% scatta il mini-game di nascondimento.",
  },
  {
    title: "// navigazione",
    body: "Tab in basso: Terminal, Shop, Chat, Stats. Menu ☰ per Stock, Compiti, Settings e Help. Buon coding — don't worry about a thing.",
  },
];

export function TutorialOverlay() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() => !isTutorialComplete());

  // Dopo il boot sequence, sul terminale (PRD §7 — Tutorial Intro)
  if (!visible || path === "/" || path === "/minigame" || path === "/game-over") return null;

  const done = step >= STEPS.length - 1;
  const current = STEPS[step];

  const finish = () => {
    completeTutorial();
    playClick();
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-silicon-black/90 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md terminal-border rounded-sm bg-silicon-gray p-5 space-y-4 font-mono">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          tutorial.exe · {step + 1}/{STEPS.length}
        </p>
        <h2 className="text-lg text-primary text-glow">{current.title}</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">{current.body}</p>
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                playClick();
                setStep((s) => s - 1);
              }}
              className="flex-1 rounded-sm border border-primary/40 py-2 text-[11px] uppercase text-muted-foreground hover:text-primary"
            >
              indietro
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              playClick();
              if (done) finish();
              else setStep((s) => s + 1);
            }}
            className="flex-1 rounded-sm border-2 border-primary bg-primary/10 py-2 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {done ? "enter terminal" : "avanti"}
          </button>
        </div>
        <button
          type="button"
          onClick={finish}
          className="w-full text-[10px] text-muted-foreground hover:text-primary"
        >
          skip tutorial
        </button>
      </div>
    </div>
  );
}
