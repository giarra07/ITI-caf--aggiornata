import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { useGame } from "@/game/GameContext";
import { PRODUCTS } from "@/game/products";
import {
  calcMissionReward,
  getStockQty as stockQty,
  newSaleId,
  pickRandomOrder,
  totalStockUnits,
} from "@/game/sales";
import { playClick, playCoin, playWin7Error } from "@/game/audio";
import { useGamePrefs } from "@/components/MusicController";
import { simRewardMul } from "@/game/gamePrefs";
import { Timer, Zap, ShoppingBag, FlaskConical } from "lucide-react";

export const Route = createFileRoute("/missions")({
  head: () => ({
    meta: [
      { title: "Micro-missioni · The ITI Café" },
      { name: "description", content: "Missioni urgenti dei laboratori dell'ITI Copernico." },
    ],
  }),
  component: MissionsPage,
});

interface Mission {
  id: string;
  client: string;
  productId: string;
  qty: number;
  rewardPerUnit: number;
  expiresAt: number;
  status: "open" | "done" | "failed";
}

const CLIENTS = [
  "lab_chimica",
  "5B_dev",
  "rep_assemblea",
  "elettronica_2A",
  "info_3B",
  "bidell0_x",
  "prof_pyth0n",
  "kr1ptik_4B",
];
const MISSION_LIFETIME_MS = 60_000;

function makeMission(): Mission {
  const { product, qty } = pickRandomOrder();
  return {
    id: newSaleId(),
    client: CLIENTS[Math.floor(Math.random() * CLIENTS.length)],
    productId: product.id,
    qty,
    rewardPerUnit: calcMissionReward(product),
    expiresAt: Date.now() + MISSION_LIFETIME_MS,
    status: "open",
  };
}

function MissionsPage() {
  const { state, sellInventory, canFulfill } = useGame();
  const [prefs, setPrefs] = useGamePrefs();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState<string | null>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setMissions([makeMission(), makeMission()]);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setMissions((arr) => {
        const open = arr.filter((m) => m.status === "open").length;
        if (open >= 3) return arr;
        return [...arr.slice(-6), makeMission()];
      });
    }, 20_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setMissions((arr) =>
      arr.map((m) => (m.status === "open" && now >= m.expiresAt ? { ...m, status: "failed" } : m)),
    );
  }, [now]);

  const accept = (m: Mission) => {
    if (m.status !== "open") return;
    if (!canFulfill(m.productId, m.qty)) {
      playWin7Error();
      setErr("Stock insufficiente — compra merce nello Shop");
      return;
    }
    const res = sellInventory(m.productId, m.qty, m.rewardPerUnit, {
      missionSim: prefs.simMode,
    });
    if (!res.ok) {
      playWin7Error();
      setErr(res.reason ?? "Vendita fallita");
      return;
    }
    playCoin();
    setErr(null);
    setMissions((arr) => arr.map((x) => (x.id === m.id ? { ...x, status: "done" } : x)));
  };

  const stockTotal = totalStockUnits(state.inventory);

  return (
    <div className="relative min-h-screen bg-silicon-black pb-20 text-primary">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <TerminalHeader />
      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            // missions.cron
          </p>
          <h1 className="font-mono text-xl text-primary text-glow">$ ./urgent_jobs --watch</h1>
        </div>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <FlaskConical size={12} /> class simulation
            </span>
            <button
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, simMode: !p.simMode }))}
              className={`px-2 py-1 rounded-sm border text-[10px] uppercase ${prefs.simMode ? "border-secondary bg-secondary/20 text-secondary text-glow-yellow" : "border-muted-foreground/40 text-muted-foreground"}`}
            >
              {prefs.simMode ? "enhanced ON" : "off"}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            // bonus CPN x{simRewardMul().toFixed(1)} · sospetto leggermente ↑
          </p>
        </section>

        {stockTotal === 0 && (
          <div className="terminal-border rounded-sm border-secondary/50 bg-secondary/10 p-3 font-mono text-xs">
            <p className="text-secondary text-glow-yellow flex items-center gap-2">
              <ShoppingBag size={14} />
              nessuno stock — compiti non completabili
            </p>
            <p className="mt-1 text-muted-foreground">
              I compiti sono random — anticipa la domanda, compra nello{" "}
              <Link to="/shop" className="text-primary underline hover:text-glow">
                Shop
              </Link>{" "}
              e consegna prima del timeout.
            </p>
          </div>
        )}

        {err && (
          <p className="font-mono text-[11px] text-destructive text-glow-red">[stderr] {err}</p>
        )}

        <ul className="space-y-2">
          {missions.length === 0 && (
            <li className="text-xs text-muted-foreground font-mono">// nessun job in coda…</li>
          )}
          {missions.map((m) => {
            const p = PRODUCTS.find((x) => x.id === m.productId);
            if (!p) return null;
            const remaining = Math.max(0, m.expiresAt - now);
            const pct = m.status === "open" ? remaining / MISSION_LIFETIME_MS : 0;
            const total = Math.round(
              m.rewardPerUnit * m.qty * (prefs.simMode ? simRewardMul() : 1),
            );
            const inStock = stockQty(state.inventory, m.productId);
            const ready = m.status === "open" && canFulfill(m.productId, m.qty);
            return (
              <li
                key={m.id}
                className={`terminal-border rounded-sm p-3 font-mono text-xs space-y-2 ${m.status !== "open" ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-secondary text-glow-yellow">@{m.client}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Timer size={10} /> {(remaining / 1000).toFixed(0)}s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={p.icon}
                    alt=""
                    aria-hidden
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-primary">
                      {m.qty}x {p.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">// {p.codename}</p>
                    {m.status === "open" && (
                      <p
                        className={`text-[10px] mt-0.5 ${ready ? "text-primary" : "text-destructive"}`}
                      >
                        stash: {inStock}/{m.qty}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-secondary text-glow-yellow flex items-center justify-end gap-1">
                      <Zap size={10} /> {total} CPN
                    </p>
                    <p className="text-[9px] text-muted-foreground">{m.rewardPerUnit}/u</p>
                  </div>
                </div>
                <div className="h-1 w-full bg-primary/15 overflow-hidden rounded-sm">
                  <div
                    className="h-full bg-primary transition-[width] duration-500"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                {m.status === "open" && (
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      accept(m);
                    }}
                    disabled={!ready}
                    className="w-full rounded-sm border border-primary bg-primary/10 px-2 py-1.5 text-[11px] uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
                  >
                    {ready ? "./accept_job.sh" : "stock insufficiente — vai shop"}
                  </button>
                )}
                {m.status === "done" && (
                  <p className="text-[10px] text-primary">
                    [ok] consegna effettuata · +{total} CPN
                  </p>
                )}
                {m.status === "failed" && (
                  <p className="text-[10px] text-destructive text-glow-red">
                    [timeout] missione scaduta
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-[10px] text-muted-foreground font-mono">
          inventario: <span className="text-primary">{stockTotal} unità</span> · saldo:{" "}
          <span className="text-secondary">{state.coins} CPN</span>
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
