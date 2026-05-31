import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Zap, Settings, HelpCircle } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { playClick } from "@/game/audio";

const SECONDARY_LINKS = [
  { to: "/missions", label: "Compiti", hint: "urgent_jobs", icon: Zap },
  { to: "/settings", label: "Settings", hint: "config", icon: Settings },
] as const;

const HELP_LINES = [
  "// Ciclo giornaliero: ogni 10 min real-time = 1 giorno scolastico",
  "// +5 CoperniCoin di paghetta all'inizio di ogni giorno",
  "// Shop: compra stock · Chat/Missions: vendi con markup",
  "// Sospetto alto → mini-game nascondi · fallimento → SGAMATO",
  "// Musica: metti three-little-birds.mp3 in /public/audio/",
];

export function AppMenu() {
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (path === "/" || path === "/minigame" || path === "/game-over") return null;

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            onClick={() => playClick()}
            className="shrink-0 rounded-sm border border-primary/40 p-1.5 text-primary hover:bg-primary/10 hover:border-primary"
            aria-label="Menu secondario"
          >
            <Menu size={16} />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[min(100vw,20rem)] border-primary/40 bg-silicon-gray font-mono text-primary"
        >
          <SheetHeader>
            <SheetTitle className="text-left font-mono text-sm text-primary text-glow">
              // menu.hamburger
            </SheetTitle>
          </SheetHeader>
          <nav className="mt-4 space-y-1" aria-label="Secondary">
            {SECONDARY_LINKS.map(({ to, label, hint, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => {
                  playClick();
                  setOpen(false);
                }}
                className={`flex items-center gap-3 rounded-sm border px-3 py-2.5 text-xs transition-colors ${
                  path === to || path.startsWith(to + "/")
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/25 text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <Icon size={16} />
                <span>
                  <span className="block font-bold uppercase tracking-wider">{label}</span>
                  <span className="text-[10px] opacity-70">// {hint}</span>
                </span>
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                playClick();
                setOpen(false);
                setHelpOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-sm border border-primary/25 px-3 py-2.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              <HelpCircle size={16} />
              <span>
                <span className="block font-bold uppercase tracking-wider">Help</span>
                <span className="text-[10px] opacity-70">// man --brief</span>
              </span>
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      {helpOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-silicon-black/85 p-4">
          <div className="w-full max-w-md terminal-border rounded-sm bg-silicon-gray p-4 space-y-3 font-mono text-xs">
            <p className="text-sm text-primary text-glow">$ man iti-cafe</p>
            <ul className="space-y-1.5 text-muted-foreground leading-relaxed">
              {HELP_LINES.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                playClick();
                setHelpOpen(false);
              }}
              className="w-full rounded-sm border border-primary bg-primary/10 py-2 uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground"
            >
              ok
            </button>
          </div>
        </div>
      )}
    </>
  );
}
