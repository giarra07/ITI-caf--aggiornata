import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { useGame } from "@/game/GameContext";
import { PRODUCTS } from "@/game/products";
import {
  calcOfferPrice,
  getStockQty as stockQty,
  newSaleId,
  pickRandomOrder,
  totalStockUnits,
} from "@/game/sales";
import { playClick, playCoin, playWin7Error } from "@/game/audio";
import { Send, AlertCircle, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Pizzini.exe · The ITI Café" },
      {
        name: "description",
        content: "Chat clandestina della rete studentesca dell'ITI Copernico.",
      },
    ],
  }),
  component: ChatPage,
});

interface Msg {
  id: string;
  from: string;
  text: string;
  at: number;
  request: { productId: string; qty: number; offer: number };
  resolved?: "sold" | "denied" | "nostock";
}

const HANDLES = [
  "kr1ptik_4B",
  "lab_rat_2C",
  "rep_d_istituto",
  "void_5A",
  "bidell0_x",
  "prof_pyth0n",
];

function makeRequest(): Msg {
  const { product, qty } = pickRandomOrder();
  const offer = calcOfferPrice(product);
  const from = HANDLES[Math.floor(Math.random() * HANDLES.length)];
  const flavor = [
    `psst, hai ${product.name}? offro ${offer} CPN/pz x${qty}`,
    `mi serve ${product.codename} subito, ${qty} pz a ${offer}`,
    `>> ping <<  ${qty}x ${product.name} per ${offer} CPN cad. ok?`,
    `compito tra 10min, dammi ${qty}x ${product.name}. ${offer} CPN/u`,
  ];
  return {
    id: newSaleId(),
    from,
    text: flavor[Math.floor(Math.random() * flavor.length)],
    at: Date.now(),
    request: { productId: product.id, qty, offer },
  };
}

function ChatPage() {
  const { state, sellInventory, canFulfill } = useGame();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    setMessages([makeRequest(), makeRequest()]);
  }, []);

  /* Nuovi messaggi in arrivo */
  useEffect(() => {
    const id = setInterval(
      () => {
        setMessages((m) => [...m.slice(-20), makeRequest()]);
      },
      12_000 + Math.random() * 6_000,
    );
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const accept = (m: Msg) => {
    if (m.resolved) return;
    if (!canFulfill(m.request.productId, m.request.qty)) {
      playWin7Error();
      setErr("Stock insufficiente — compra merce nello Shop prima di vendere");
      return;
    }
    const res = sellInventory(m.request.productId, m.request.qty, m.request.offer);
    if (!res.ok) {
      playWin7Error();
      setErr(res.reason ?? "errore");
      return;
    }
    playCoin();
    setErr(null);
    setMessages((arr) => arr.map((x) => (x.id === m.id ? { ...x, resolved: "sold" } : x)));
  };

  const deny = (m: Msg) => {
    playClick();
    setMessages((arr) => arr.map((x) => (x.id === m.id ? { ...x, resolved: "denied" } : x)));
  };

  const stockTotal = totalStockUnits(state.inventory);

  return (
    <div className="relative min-h-screen bg-silicon-black pb-24 text-primary">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <TerminalHeader />

      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              // pizzini.exe
            </p>
            <h1 className="font-mono text-xl text-primary text-glow">$ tail -f /var/log/chat</h1>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            <span className="caret">online</span>
          </span>
        </div>

        {stockTotal === 0 && (
          <div className="terminal-border rounded-sm border-secondary/50 bg-secondary/10 p-3 font-mono text-xs">
            <p className="text-secondary text-glow-yellow flex items-center gap-2">
              <ShoppingBag size={14} />
              stash vuoto — nessuna vendita possibile
            </p>
            <p className="mt-1 text-muted-foreground">
              Le richieste sono a caso — compra nello{" "}
              <Link to="/shop" className="text-primary underline hover:text-glow">
                Shop
              </Link>{" "}
              ciò che ti chiedono prima che scada il timer.
            </p>
          </div>
        )}

        <div className="terminal-border rounded-sm bg-silicon-gray/60 p-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {messages.map((m) => {
            const p = PRODUCTS.find((x) => x.id === m.request.productId);
            const inStock = stockQty(state.inventory, m.request.productId);
            const ready = canFulfill(m.request.productId, m.request.qty);
            return (
              <article
                key={m.id}
                className="font-mono text-xs space-y-1 border-b border-primary/15 pb-2 last:border-0"
              >
                <header className="flex items-center justify-between">
                  <span className="text-secondary text-glow-yellow">@{m.from}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {new Date(m.at).toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </header>
                <p className="text-primary/90 flex items-start gap-2">
                  {p && (
                    <img
                      src={p.icon}
                      alt=""
                      aria-hidden
                      width={20}
                      height={20}
                      className="h-5 w-5 object-contain shrink-0"
                    />
                  )}
                  <span>{m.text}</span>
                </p>
                {!m.resolved && p && (
                  <p
                    className={`text-[10px] ${ready ? "text-primary" : "text-destructive text-glow-red"}`}
                  >
                    stash: {inStock}/{m.request.qty} {p.name}
                    {!ready && " — stock insufficiente"}
                  </p>
                )}
                {!m.resolved && (
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => accept(m)}
                      disabled={!ready}
                      className="flex-1 rounded-sm border border-primary bg-primary/10 px-2 py-1 text-[11px] uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground inline-flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
                    >
                      <Send size={11} /> ./sell.sh ({m.request.offer * m.request.qty} CPN)
                    </button>
                    <button
                      type="button"
                      onClick={() => deny(m)}
                      className="rounded-sm border border-destructive/50 px-2 py-1 text-[11px] uppercase tracking-wider text-destructive hover:bg-destructive/10"
                    >
                      kill
                    </button>
                  </div>
                )}
                {m.resolved === "sold" && (
                  <p className="text-[10px] text-primary/80">
                    [ok] transazione completata · +{m.request.offer * m.request.qty} CPN
                  </p>
                )}
                {m.resolved === "denied" && (
                  <p className="text-[10px] text-muted-foreground">[killed] connessione chiusa</p>
                )}
                {m.resolved === "nostock" && (
                  <p className="text-[10px] text-destructive text-glow-red flex items-center gap-1">
                    <AlertCircle size={11} /> [err] stock insufficiente — vai allo shop
                  </p>
                )}
              </article>
            );
          })}
          <div ref={endRef} />
        </div>

        {err && (
          <p className="font-mono text-[11px] text-destructive text-glow-red">[stderr] {err}</p>
        )}
        <p className="text-[10px] text-muted-foreground font-mono">
          inventario: <span className="text-primary">{stockTotal} unità</span> · saldo:{" "}
          <span className="text-secondary">{state.coins} CPN</span>
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
