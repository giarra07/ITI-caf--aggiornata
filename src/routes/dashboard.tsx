import { createFileRoute, Link } from "@tanstack/react-router";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { SuspicionMeter } from "@/components/SuspicionMeter";
import { DayNotice } from "@/components/DayNotice";
import { CrisisBanner } from "@/components/CrisisBanner";
import { LeafIcon } from "@/components/LeafIcon";
import { useGame } from "@/game/GameContext";
import { ShoppingBag, MessageSquare, Package, Zap, AlertTriangle } from "lucide-react";
import rastaHacker from "@/assets/rasta-hacker.png";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Terminal · The ITI Café" },
      {
        name: "description",
        content: "Il tuo terminale operativo per gestire il coffee shop clandestino.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { state } = useGame();
  const cartCount = state.cart.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="relative min-h-screen bg-silicon-black pb-20 text-primary overflow-hidden">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />

      <LeafIcon
        size={140}
        className="pointer-events-none absolute -top-8 -left-10 z-0 text-primary/15 -rotate-12"
      />
      <LeafIcon
        size={110}
        className="pointer-events-none absolute top-40 -right-8 z-0 text-secondary/15 rotate-45"
      />
      <LeafIcon
        size={90}
        className="pointer-events-none absolute bottom-32 -left-6 z-0 text-primary/10 rotate-12"
      />

      <TerminalHeader />

      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-5">
        <DayNotice />
        <CrisisBanner />

        <section className="terminal-border rounded-sm bg-card/60 p-4 flex items-center gap-4">
          <img
            src={rastaHacker}
            alt="Rasta hacker che fuma davanti al laptop"
            width={96}
            height={96}
            className="h-24 w-24 shrink-0 object-contain drop-shadow-[0_0_18px_rgba(0,255,65,0.35)]"
          />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">whoami</p>
            <p className="font-mono text-lg text-primary text-glow truncate">{state.handle}</p>
            <p className="mt-1 text-[11px] text-muted-foreground italic">
              "Three little birds, sitting in my <span className="text-secondary">stdout</span>..."
            </p>
          </div>
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-4">
          <SuspicionMeter value={state.suspicion} />
        </section>

        <section>
          <h2 className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            // quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <ActionCard
              to="/shop"
              icon={ShoppingBag}
              label="Catalogo"
              hint={cartCount > 0 ? `${cartCount} nel cart` : "darknet shelf"}
              badge={cartCount > 0}
            />
            <ActionCard to="/chat" icon={MessageSquare} label="Pizzini.exe" hint="laboratori" />
            <ActionCard
              to="/inventory"
              icon={Package}
              label="Stock"
              hint={`${state.inventory.reduce((s, l) => s + l.qty, 0)} pz`}
            />
            <ActionCard to="/missions" icon={Zap} label="Compiti" hint="bonus xp" />
          </div>
        </section>

        {state.event && (
          <section className="terminal-border rounded-sm border-secondary/60 bg-secondary/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-secondary shrink-0 mt-0.5" size={16} />
              <div className="text-xs">
                <p className="font-bold text-secondary text-glow-yellow">
                  [event] {state.event.title}
                </p>
                <p className="text-muted-foreground mt-0.5">{state.event.description}</p>
              </div>
            </div>
          </section>
        )}

        <section className="terminal-border rounded-sm bg-card/60 p-4 text-[11px] font-mono leading-relaxed text-muted-foreground">
          <p>
            <span className="text-primary">$</span> cat /etc/motd
          </p>
          <p className="mt-2 text-primary/80">// Open Laptop, get high and write code</p>
          <p>
            // day {state.day} · earned {state.stats.totalEarned} CPN total
          </p>
          <p>
            // busts: {state.stats.busts} · survived: {state.stats.daysSurvived}d
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

type QuickRoute = "/shop" | "/chat" | "/inventory" | "/missions";

function ActionCard({
  to,
  icon: Icon,
  label,
  hint,
  badge,
}: {
  to: QuickRoute;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  hint: string;
  badge?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative terminal-border rounded-sm bg-card/60 p-3 transition-all hover:bg-primary/10 hover:border-primary active:translate-y-px"
    >
      {badge && (
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_var(--rasta-red)]" />
      )}
      <Icon size={20} />
      <p className="mt-2 font-mono text-sm font-bold text-primary group-hover:text-glow">{label}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</p>
    </Link>
  );
}
