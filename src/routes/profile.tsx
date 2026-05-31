import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { useGame } from "@/game/GameContext";
import { Award, Coins, Skull, TrendingUp, Settings as SettingsIcon, Trophy } from "lucide-react";
import { loadLeaderboard, fetchCloudLeaderboard, type LeaderboardEntry } from "@/game/leaderboard";
import { isSupabaseConfigured } from "@/lib/supabase";
import rastaHacker from "@/assets/rasta-hacker.png";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Stats · The ITI Café" },
      { name: "description", content: "Statistiche e achievement del tuo dealer studentesco." },
    ],
  }),
  component: ProfilePage,
});

interface Achievement {
  id: string;
  label: string;
  hint: string;
  unlocked: boolean;
}

function ProfilePage() {
  const { state } = useGame();
  const xp = state.stats.totalEarned + state.stats.daysSurvived * 5;
  const level = 1 + Math.floor(xp / 50);
  const xpInLevel = xp % 50;

  const achievements: Achievement[] = [
    {
      id: "first_sale",
      label: "first_sale.log",
      hint: "vendi 1 unità",
      unlocked: state.stats.totalSold >= 1,
    },
    {
      id: "ten_sales",
      label: "stack_overflow.dll",
      hint: "vendi 10 unità",
      unlocked: state.stats.totalSold >= 10,
    },
    {
      id: "fifty_coin",
      label: "moneymaker.sh",
      hint: "guadagna 50 CPN totali",
      unlocked: state.stats.totalEarned >= 50,
    },
    {
      id: "survive_3",
      label: "uptime_72h.svc",
      hint: "sopravvivi 3 giorni",
      unlocked: state.stats.daysSurvived >= 3,
    },
    {
      id: "raid_evaded",
      label: "kernel_patched.ko",
      hint: "evita 1 raid",
      unlocked: state.stats.busts === 0 && state.stats.daysSurvived >= 2,
    },
    {
      id: "darknet_lord",
      label: "root@iti.cafe",
      hint: "guadagna 200 CPN",
      unlocked: state.stats.totalEarned >= 200,
    },
  ];
  const unlocked = achievements.filter((a) => a.unlocked).length;
  const [board, setBoard] = useState<LeaderboardEntry[]>(() => loadLeaderboard());

  useEffect(() => {
    if (isSupabaseConfigured) {
      void fetchCloudLeaderboard().then((rows) => {
        if (rows.length) setBoard(rows);
      });
    }
  }, [state.stats.totalEarned]);

  return (
    <div className="relative min-h-screen bg-silicon-black pb-24 text-primary">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <TerminalHeader />
      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-4">
        <section className="terminal-border rounded-sm bg-card/60 p-4 flex items-center gap-3">
          <img
            src={rastaHacker}
            alt=""
            aria-hidden
            width={72}
            height={72}
            className="h-18 w-18 object-contain drop-shadow-[0_0_12px_rgba(0,255,65,0.35)]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">// whoami</p>
            <p className="font-mono text-lg text-primary text-glow truncate">{state.handle}</p>
            <p className="font-mono text-[11px] text-secondary text-glow-yellow">
              lvl {level} · {xp} xp
            </p>
            <div className="mt-1 h-1.5 w-full bg-primary/15 rounded-sm overflow-hidden">
              <div
                className="h-full bg-secondary transition-all"
                style={{ width: `${(xpInLevel / 50) * 100}%` }}
              />
            </div>
          </div>
          <Link
            to="/settings"
            className="self-start text-muted-foreground hover:text-primary"
            aria-label="impostazioni"
          >
            <SettingsIcon size={18} />
          </Link>
        </section>

        <section className="grid grid-cols-2 gap-2">
          <StatCard icon={Coins} label="CPN guadagnati" value={state.stats.totalEarned} />
          <StatCard icon={TrendingUp} label="unità vendute" value={state.stats.totalSold} />
          <StatCard icon={Award} label="giorni survived" value={state.stats.daysSurvived} />
          <StatCard icon={Skull} label="busts subiti" value={state.stats.busts} danger />
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
          <header className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground">// achievements.json</span>
            <span className="text-secondary text-glow-yellow">
              {unlocked}/{achievements.length}
            </span>
          </header>
          <ul className="space-y-1.5">
            {achievements.map((a) => (
              <li
                key={a.id}
                className={`flex items-center justify-between font-mono text-xs px-2 py-1.5 rounded-sm ${a.unlocked ? "bg-primary/10 text-primary" : "bg-silicon-gray/40 text-muted-foreground"}`}
              >
                <span className="flex items-center gap-2">
                  <Award size={12} className={a.unlocked ? "text-secondary" : ""} />
                  <span>{a.label}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {a.unlocked ? "[ok]" : a.hint}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
          <header className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Trophy size={12} /> // leaderboard.local
            </span>
            <span className="text-secondary text-glow-yellow">
              top {board.length}
              {isSupabaseConfigured ? " · cloud" : " · local"}
            </span>
          </header>
          {board.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">// nessun record ancora</p>
          ) : (
            <ul className="space-y-1">
              {board.map((e, i) => (
                <li
                  key={`${e.handle}-${e.at}`}
                  className={`flex items-center justify-between font-mono text-xs px-2 py-1 rounded-sm ${e.handle === state.handle ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                >
                  <span>
                    <span className="text-secondary mr-2">#{i + 1}</span>@{e.handle}
                  </span>
                  <span className="tabular-nums">{e.totalEarned} CPN</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  danger,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="terminal-border rounded-sm bg-card/60 p-3 font-mono">
      <div
        className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest ${danger ? "text-destructive" : "text-muted-foreground"}`}
      >
        <Icon size={11} /> {label}
      </div>
      <p
        className={`mt-1 text-xl tabular-nums ${danger ? "text-destructive text-glow-red" : "text-primary text-glow"}`}
      >
        {value}
      </p>
    </div>
  );
}
