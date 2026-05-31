import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/game/GameContext";
import { PRODUCTS } from "@/game/products";
import { playClick, playWin7Error } from "@/game/audio";
import { AlertOctagon, Package } from "lucide-react";

export const Route = createFileRoute("/minigame")({
  head: () => ({
    meta: [
      { title: "RAID · The ITI Café" },
      { name: "description", content: "Trascina la merce nei cassetti prima che arrivi il preside." },
    ],
  }),
  component: MiniGamePage,
});

const DRAWERS = 9;
const TIME_LIMIT_MS = 14_000;

interface StashPiece {
  id: string;
  productId: string;
  name: string;
  icon: string;
}

function MiniGamePage() {
  const { state, resolveRaid } = useGame();
  const router = useRouter();

  const pieces = useMemo(() => {
    const list: StashPiece[] = [];
    const total = Math.min(
      DRAWERS,
      Math.max(4, state.inventory.reduce((s, l) => s + l.qty, 0)),
    );
    for (const line of state.inventory) {
      const p = PRODUCTS.find((x) => x.id === line.productId);
      if (!p) continue;
      for (let i = 0; i < line.qty && list.length < total; i++) {
        list.push({
          id: `${line.productId}-${i}-${list.length}`,
          productId: line.productId,
          name: p.name,
          icon: p.icon,
        });
      }
    }
    while (list.length < total) {
      list.push({
        id: `decoy-${list.length}`,
        productId: "decoy",
        name: "pacco",
        icon: "",
      });
    }
    return list;
  }, [state.inventory]);

  const [pool, setPool] = useState<StashPiece[]>(pieces);
  const [drawers, setDrawers] = useState<(StashPiece | null)[]>(() =>
    Array.from({ length: DRAWERS }, () => null),
  );
  const [dragId, setDragId] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(Date.now());
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setPool(pieces);
    setDrawers(Array.from({ length: DRAWERS }, () => null));
  }, [pieces]);

  useEffect(() => {
    if (resolved) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [resolved]);

  const remaining = Math.max(0, TIME_LIMIT_MS - (now - startedAt));
  const hiddenCount = drawers.filter(Boolean).length;
  const total = pieces.length;

  useEffect(() => {
    if (resolved) return;
    if (pool.length === 0 && hiddenCount >= total) {
      setResolved(true);
      resolveRaid(true);
      setTimeout(() => router.navigate({ to: "/dashboard" }), 1500);
    } else if (remaining <= 0) {
      setResolved(true);
      playWin7Error();
      resolveRaid(false);
      setTimeout(() => router.navigate({ to: "/game-over" }), 1500);
    }
  }, [pool.length, hiddenCount, total, remaining, resolved, resolveRaid, router]);

  const onDragStart = (id: string) => {
    if (resolved) return;
    setDragId(id);
    playClick();
  };

  const onDropDrawer = (drawerIdx: number) => {
    if (resolved || !dragId) return;
    const piece = pool.find((p) => p.id === dragId);
    if (!piece) return;

    if (drawers[drawerIdx]) {
      playWin7Error();
      return;
    }

    playClick();
    setDrawers((d) => {
      const next = [...d];
      next[drawerIdx] = piece;
      return next;
    });
    setPool((p) => p.filter((x) => x.id !== dragId));
    setDragId(null);
  };

  const pct = (remaining / TIME_LIMIT_MS) * 100;

  return (
    <div className="relative min-h-screen bg-silicon-black text-primary flex flex-col items-center justify-center px-4 py-6">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <p className="text-destructive text-glow-red font-mono text-xs flex items-center justify-center gap-1 animate-pulse">
            <AlertOctagon size={14} /> // raid_in_progress
          </p>
          <h1 className="font-mono text-2xl text-secondary text-glow-yellow">PRESIDE IN ARRIVO</h1>
          <p className="font-mono text-[11px] text-muted-foreground">
            trascina ogni pacco in un cassetto libero (drag & drop)
          </p>
        </div>

        <div className="h-2 w-full bg-primary/15 rounded-sm overflow-hidden">
          <div
            className="h-full bg-destructive transition-[width] duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="text-center font-mono text-xs text-primary">
          {hiddenCount}/{total} nascosti · {pool.length} in mano — {(remaining / 1000).toFixed(1)}s
        </p>

        <section className="terminal-border rounded-sm bg-card/40 p-3 min-h-[72px]">
          <p className="text-[10px] uppercase text-muted-foreground mb-2 flex items-center gap-1">
            <Package size={12} /> merce da nascondere
          </p>
          <div className="flex flex-wrap gap-2">
            {pool.map((piece) => (
              <div
                key={piece.id}
                draggable
                onDragStart={() => onDragStart(piece.id)}
                className="cursor-grab active:cursor-grabbing flex items-center gap-1.5 rounded-sm border border-secondary bg-secondary/15 px-2 py-1.5 text-[10px] text-secondary touch-none"
              >
                {piece.icon ? (
                  <img src={piece.icon} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                ) : (
                  <span>📦</span>
                )}
                <span className="max-w-[80px] truncate">{piece.name}</span>
              </div>
            ))}
            {pool.length === 0 && (
              <span className="text-[10px] text-primary">[ok] tutto nei cassetti</span>
            )}
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2">
          {drawers.map((item, i) => (
            <div
              key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropDrawer(i)}
              className={`aspect-square rounded-sm font-mono text-xs flex flex-col items-center justify-center gap-1 border-2 border-dashed transition-colors ${
                item
                  ? "border-primary bg-primary/15 text-primary"
                  : dragId
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-primary/30 bg-silicon-gray text-muted-foreground"
              }`}
            >
              <span className="text-[9px] opacity-60">0x{i.toString(16).toUpperCase()}</span>
              {item && (
                <>
                  {item.icon ? (
                    <img src={item.icon} alt="" width={24} height={24} className="h-6 w-6 object-contain" />
                  ) : (
                    <span>✓</span>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {resolved && pool.length === 0 && (
          <p className="text-center font-mono text-sm text-primary text-glow">
            [ok] tutto pulito → /dashboard
          </p>
        )}
        {resolved && remaining <= 0 && pool.length > 0 && (
          <p className="text-center font-mono text-sm text-destructive text-glow-red">
            [fatal] sgamato → /game-over
          </p>
        )}
      </div>
    </div>
  );
}
