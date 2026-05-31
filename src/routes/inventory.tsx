import { createFileRoute } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { useGame } from "@/game/GameContext";
import { PRODUCTS } from "@/game/products";
import { playClick } from "@/game/audio";
import { Eye, EyeOff, ShieldAlert, Package as PackageIcon } from "lucide-react";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Stock · The ITI Café" },
      { name: "description", content: "Gestisci e nascondi lo stock prima del raid del preside." },
    ],
  }),
  component: InventoryPage,
});

const CAPACITY = 30;

function InventoryPage() {
  const { state, toggleHide, hideAll } = useGame();
  const total = state.inventory.reduce((s, l) => s + l.qty, 0);
  const exposedRisk = state.inventory.reduce((s, l) => {
    if (l.hidden) return s;
    const p = PRODUCTS.find((x) => x.id === l.productId);
    return s + (p?.risk ?? 0) * l.qty;
  }, 0);
  const capPct = Math.min(100, (total / CAPACITY) * 100);

  return (
    <div className="relative min-h-screen bg-silicon-black pb-24 text-primary">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <TerminalHeader />
      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">// stash.fs</p>
          <h1 className="font-mono text-xl text-primary text-glow">$ ls -la /stash</h1>
        </div>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <PackageIcon size={12} /> capienza zaino
            </span>
            <span
              className={
                total > CAPACITY * 0.85 ? "text-destructive text-glow-red" : "text-primary"
              }
            >
              {total}/{CAPACITY}
            </span>
          </div>
          <div className="h-2 w-full bg-primary/15 overflow-hidden rounded-sm">
            <div
              className={`h-full transition-all ${total > CAPACITY * 0.85 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${capPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert size={12} /> rischio esposto
            </span>
            <span
              className={
                exposedRisk > 30
                  ? "text-destructive text-glow-red"
                  : exposedRisk > 10
                    ? "text-secondary text-glow-yellow"
                    : "text-primary"
              }
            >
              {exposedRisk}
            </span>
          </div>
          <button
            onClick={() => {
              playClick();
              hideAll();
            }}
            disabled={state.inventory.length === 0}
            className="w-full mt-1 rounded-sm border border-secondary bg-secondary/10 px-2 py-1.5 text-[11px] uppercase tracking-widest text-secondary hover:bg-secondary hover:text-secondary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            $ sudo hide --all (-8 sospetto)
          </button>
        </section>

        {state.inventory.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground font-mono py-12">
            // 0 pacchi nel cassetto. vai allo shop ↑
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {state.inventory.map((line) => {
              const p = PRODUCTS.find((x) => x.id === line.productId);
              if (!p) return null;
              return (
                <li
                  key={line.productId}
                  className={`terminal-border rounded-sm p-3 font-mono text-xs space-y-2 ${line.hidden ? "bg-silicon-gray/40 opacity-70" : "bg-card/60"}`}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={p.icon}
                      alt=""
                      aria-hidden
                      width={32}
                      height={32}
                      className={`h-8 w-8 object-contain shrink-0 ${line.hidden ? "grayscale" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-primary truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">// {p.codename}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-primary">x{line.qty}</span>
                    <span
                      className={
                        p.risk >= 7
                          ? "text-destructive"
                          : p.risk >= 4
                            ? "text-secondary"
                            : "text-muted-foreground"
                      }
                    >
                      risk {p.risk}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      playClick();
                      toggleHide(line.productId);
                    }}
                    className={`w-full rounded-sm px-2 py-1 text-[10px] uppercase tracking-widest inline-flex items-center justify-center gap-1 border ${
                      line.hidden
                        ? "border-muted-foreground/40 text-muted-foreground hover:text-primary hover:border-primary"
                        : "border-primary text-primary bg-primary/10 hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    {line.hidden ? (
                      <>
                        <EyeOff size={10} /> hidden
                      </>
                    ) : (
                      <>
                        <Eye size={10} /> exposed
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
