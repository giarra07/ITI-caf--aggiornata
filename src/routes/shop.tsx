import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { useGame } from "@/game/GameContext";
import { PRODUCTS, CATEGORY_LABEL, type ProductCategory } from "@/game/products";
import { playClick, playCoin, playWin7Error } from "@/game/audio";
import { Plus, Minus, ShoppingCart, X } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Catalogo · The ITI Café" },
      { name: "description", content: "Catalogo darknet del coffee shop dell'ITI Copernico." },
    ],
  }),
  component: ShopPage,
});

const CATEGORIES: ("all" | ProductCategory)[] = ["all", "erbe", "pasticche", "gadget"];

function ShopPage() {
  const { state, addToCart, removeFromCart, checkout, clearCart } = useGame();
  const [cat, setCat] = useState<"all" | ProductCategory>("all");
  const [openCart, setOpenCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => (cat === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === cat)),
    [cat],
  );

  const cartCount = state.cart.reduce((s, l) => s + l.qty, 0);
  const cartTotal = state.cart.reduce((sum, l) => {
    const p = PRODUCTS.find((x) => x.id === l.productId);
    return sum + (p?.basePrice ?? 0) * l.qty;
  }, 0);

  const onCheckout = () => {
    const res = checkout();
    if (res.ok) {
      playCoin();
      setOpenCart(false);
      setError(null);
    } else {
      playWin7Error();
      setError(res.reason ?? "Errore sconosciuto");
    }
  };

  return (
    <div className="relative min-h-screen bg-silicon-black pb-20 text-primary">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <TerminalHeader />

      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              // darknet
            </p>
            <h1 className="font-mono text-xl text-primary text-glow">.catalog</h1>
          </div>
          <button
            onClick={() => {
              playClick();
              setOpenCart(true);
            }}
            className="relative flex items-center gap-2 terminal-border rounded-sm px-3 py-2 font-mono text-xs hover:bg-primary/10"
          >
            <ShoppingCart size={14} />
            <span>cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => {
                playClick();
                setCat(c);
              }}
              className={`shrink-0 rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                cat === c
                  ? "border-primary bg-primary/15 text-primary text-glow"
                  : "border-primary/30 text-muted-foreground hover:text-primary hover:border-primary/60"
              }`}
            >
              {c === "all" ? "// all" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((p) => {
            const inCart = state.cart.find((l) => l.productId === p.id)?.qty ?? 0;
            return (
              <li
                key={p.id}
                className="terminal-border rounded-sm bg-card/60 p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <img
                    src={p.icon}
                    alt=""
                    aria-hidden
                    width={48}
                    height={48}
                    loading="lazy"
                    className="h-12 w-12 object-contain drop-shadow-[0_0_6px_color-mix(in_oklab,var(--acid)_40%,transparent)]"
                  />
                  <div className="text-right">
                    <p className="font-mono text-sm text-secondary text-glow-yellow">
                      {p.basePrice} CPN
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-destructive/80">
                      risk {p.risk}/10
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-mono text-sm font-bold text-primary">{p.name}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    // {p.codename}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{p.description}</p>
                <div className="mt-auto flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        playClick();
                        removeFromCart(p.id);
                      }}
                      disabled={inCart === 0}
                      className="h-7 w-7 grid place-items-center rounded-sm border border-primary/40 text-primary disabled:opacity-30 hover:bg-primary/10"
                      aria-label="Remove one"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="min-w-6 text-center font-mono text-sm tabular-nums">
                      {inCart}
                    </span>
                    <button
                      onClick={() => {
                        playClick();
                        addToCart(p.id);
                      }}
                      className="h-7 w-7 grid place-items-center rounded-sm border border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      aria-label="Add one"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </main>

      {/* Cart drawer */}
      {openCart && (
        <div className="fixed inset-0 z-50 bg-silicon-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md terminal-border rounded-sm bg-silicon-gray p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-sm text-primary text-glow">$ cat ./cart.json</h2>
              <button
                onClick={() => setOpenCart(false)}
                aria-label="Close"
                className="text-muted-foreground hover:text-primary"
              >
                <X size={16} />
              </button>
            </div>
            {state.cart.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">// empty array []</p>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {state.cart.map((line) => {
                  const p = PRODUCTS.find((x) => x.id === line.productId)!;
                  return (
                    <li
                      key={line.productId}
                      className="flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <span className="flex items-center gap-1.5 text-primary truncate">
                        <img
                          src={p.icon}
                          alt=""
                          aria-hidden
                          width={16}
                          height={16}
                          className="h-4 w-4 object-contain"
                        />
                        {p.name}
                      </span>
                      <span className="text-muted-foreground">x{line.qty}</span>
                      <span className="text-secondary tabular-nums">
                        {p.basePrice * line.qty} CPN
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center justify-between border-t border-primary/30 pt-3 font-mono text-sm">
              <span className="text-muted-foreground">TOTAL</span>
              <span className="text-secondary text-glow-yellow tabular-nums">{cartTotal} CPN</span>
            </div>
            {error && (
              <p className="text-[11px] text-destructive text-glow-red font-mono">
                [error] {error}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  playClick();
                  clearCart();
                  setError(null);
                }}
                className="flex-1 rounded-sm border border-primary/40 px-3 py-2 font-mono text-xs text-muted-foreground hover:text-destructive hover:border-destructive/60"
              >
                rm -rf cart
              </button>
              <button
                onClick={onCheckout}
                disabled={state.cart.length === 0}
                className="flex-1 rounded-sm border-2 border-primary bg-primary/10 px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40"
              >
                ./checkout.sh
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              <span className="text-destructive">[!]</span> errore = suono win7 nostalgia
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
