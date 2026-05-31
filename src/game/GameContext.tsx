import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { PRODUCTS, type Product } from "./products";
import { getStockQty, canFulfill as canFulfillStock } from "./sales";
import { difficultyRiskMul, simRewardMul, simRiskMul } from "./gamePrefs";
import { saveToIndexedDB, loadFromIndexedDB } from "./persist";
import { upsertLeaderboard } from "./leaderboard";
import { loadCloudSave, saveCloudSave, upsertCloudLeaderboard } from "./gameCloud";
import { useAuth } from "@/auth/AuthContext";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface CartLine {
  productId: string;
  qty: number;
}

export interface InventoryLine {
  productId: string;
  qty: number;
  hidden: boolean;
}

export interface DailyEvent {
  id: string;
  title: string;
  description: string;
  /** Modificatore di domanda per categoria, es. { relaxants: 2 } */
  demandMul: Partial<Record<Product["category"], number>>;
  /** Modificatore al rischio globale per ogni vendita (1 = nessun cambio) */
  riskMul: number;
}

export interface GameState {
  handle: string;
  day: number;
  coins: number;
  suspicion: number; // 0..100
  /** Timestamp (ms) di inizio del giorno corrente — usato per la barra del tempo */
  dayStartedAt: number;
  inventory: InventoryLine[];
  cart: CartLine[];
  event: DailyEvent | null;
  gameOver: boolean;
  stats: {
    totalEarned: number;
    totalSold: number;
    daysSurvived: number;
    busts: number;
  };
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

/** Durata di un giorno di gioco in ms (PRD: 10 minuti) */
export const DAY_DURATION_MS = 10 * 60 * 1000;
/** Paghetta giornaliera dei genitori */
export const DAILY_ALLOWANCE = 5;
/** Decadimento naturale del sospetto per tick */
const SUSPICION_DECAY_PER_TICK = 0.4;
/** Tick del sospetto (ms) */
const SUSPICION_TICK_MS = 3000;

const STORAGE_KEY = "iti.game.v1";

const EVENT_POOL: DailyEvent[] = [
  {
    id: "assemblea",
    title: "Assemblea d'Istituto",
    description: "Domanda di erbe x2. Tutti vogliono dormire.",
    demandMul: { erbe: 2 },
    riskMul: 0.8,
  },
  {
    id: "invalsi",
    title: "Simulazione INVALSI",
    description: "La 5ª impazzisce: pasticche x2.",
    demandMul: { pasticche: 2 },
    riskMul: 1,
  },
  {
    id: "compito_mate",
    title: "Compito di Matematica",
    description: "Gadget x2, ma i prof sono nervosi.",
    demandMul: { gadget: 2 },
    riskMul: 1.3,
  },
  {
    id: "ispezione",
    title: "Ispezione del Preside",
    description: "Ogni vendita ti costa il doppio in sospetto.",
    demandMul: {},
    riskMul: 2,
  },
  {
    id: "calma",
    title: "Giornata Calma",
    description: "Nessun evento. I prof dormono in sala professori.",
    demandMul: {},
    riskMul: 0.7,
  },
];

function randomEvent(): DailyEvent {
  return EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
}

/* -------------------------------------------------------------------------- */
/*  Reducer                                                                   */
/* -------------------------------------------------------------------------- */

type Action =
  | { type: "HYDRATE"; state: GameState }
  | { type: "SET_HANDLE"; handle: string }
  | { type: "TICK_SUSPICION" }
  | { type: "ADD_TO_CART"; productId: string }
  | { type: "REMOVE_FROM_CART"; productId: string }
  | { type: "CLEAR_CART" }
  | { type: "CHECKOUT_SUCCESS"; cost: number; suspicionDelta: number; soldQty: number }
  | { type: "SELL"; productId: string; qty: number; earned: number; suspicionDelta: number }
  | { type: "ADVANCE_DAY" }
  | { type: "TRIGGER_BUST" }
  | { type: "RESET_AFTER_BUST" }
  | { type: "RESOLVE_RAID"; success: boolean }
  | { type: "TOGGLE_HIDE"; productId: string }
  | { type: "HIDE_ALL" };

function initial(handle: string): GameState {
  return {
    handle,
    day: 1,
    coins: DAILY_ALLOWANCE,
    suspicion: 0,
    dayStartedAt: Date.now(),
    inventory: [],
    cart: [],
    event: randomEvent(),
    gameOver: false,
    stats: { totalEarned: 0, totalSold: 0, daysSurvived: 0, busts: 0 },
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "SET_HANDLE":
      return { ...state, handle: action.handle };

    case "TICK_SUSPICION":
      return {
        ...state,
        suspicion: Math.max(0, state.suspicion - SUSPICION_DECAY_PER_TICK),
      };

    case "ADD_TO_CART": {
      const existing = state.cart.find((l) => l.productId === action.productId);
      const cart = existing
        ? state.cart.map((l) => (l.productId === action.productId ? { ...l, qty: l.qty + 1 } : l))
        : [...state.cart, { productId: action.productId, qty: 1 }];
      return { ...state, cart };
    }

    case "REMOVE_FROM_CART": {
      const cart = state.cart
        .map((l) => (l.productId === action.productId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0);
      return { ...state, cart };
    }

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "CHECKOUT_SUCCESS": {
      // Trasforma il carrello in inventario (acquisto stock)
      const inv = [...state.inventory];
      for (const line of state.cart) {
        const idx = inv.findIndex((i) => i.productId === line.productId);
        if (idx >= 0) inv[idx] = { ...inv[idx], qty: inv[idx].qty + line.qty };
        else inv.push({ productId: line.productId, qty: line.qty, hidden: false });
      }
      return {
        ...state,
        coins: state.coins - action.cost,
        suspicion: Math.min(100, state.suspicion + action.suspicionDelta),
        cart: [],
        inventory: inv,
        stats: {
          ...state.stats,
          totalEarned: state.stats.totalEarned, // earned tracked when SELLING (Phase 3)
          totalSold: state.stats.totalSold + action.soldQty,
        },
      };
    }

    case "SELL": {
      const inv = state.inventory
        .map((l) => (l.productId === action.productId ? { ...l, qty: l.qty - action.qty } : l))
        .filter((l) => l.qty > 0);
      return {
        ...state,
        coins: state.coins + action.earned,
        suspicion: Math.min(100, state.suspicion + action.suspicionDelta),
        inventory: inv,
        stats: {
          ...state.stats,
          totalEarned: state.stats.totalEarned + action.earned,
          totalSold: state.stats.totalSold + action.qty,
        },
      };
    }

    case "ADVANCE_DAY":
      return {
        ...state,
        day: state.day + 1,
        coins: state.coins + DAILY_ALLOWANCE,
        dayStartedAt: Date.now(),
        event: randomEvent(),
        stats: { ...state.stats, daysSurvived: state.stats.daysSurvived + 1 },
      };

    case "TRIGGER_BUST":
      return { ...state, gameOver: true, suspicion: 100 };

    case "RESET_AFTER_BUST": {
      const fresh = initial(state.handle);
      return {
        ...fresh,
        stats: { ...state.stats, busts: state.stats.busts + 1 },
      };
    }

    case "RESOLVE_RAID":
      if (action.success) return { ...state, suspicion: 10 };
      return { ...state, gameOver: true, suspicion: 100 };

    case "TOGGLE_HIDE":
      return {
        ...state,
        inventory: state.inventory.map((l) =>
          l.productId === action.productId ? { ...l, hidden: !l.hidden } : l,
        ),
      };

    case "HIDE_ALL":
      return {
        ...state,
        inventory: state.inventory.map((l) => ({ ...l, hidden: true })),
        suspicion: Math.max(0, state.suspicion - 8),
      };

    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/*  Context                                                                   */
/* -------------------------------------------------------------------------- */

interface Ctx {
  state: GameState;
  /** ms rimanenti nel giorno corrente */
  msUntilNextDay: number;
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  /** Esegue il checkout dello stock corrente, applica costo e sospetto */
  checkout: () => { ok: boolean; reason?: string };
  /** Vende una qty di un prodotto in inventario al prezzo richiesto (markup possibile) */
  sellInventory: (
    productId: string,
    qty: number,
    unitPrice?: number,
    opts?: { missionSim?: boolean },
  ) => { ok: boolean; reason?: string };
  /** Esito raid (mini-game) */
  resolveRaid: (success: boolean) => void;
  triggerBust: () => void;
  setHandle: (h: string) => void;
  resetAfterBust: () => void;
  toggleHide: (productId: string) => void;
  hideAll: () => void;
  getStockQty: (productId: string) => number;
  canFulfill: (productId: string, qty: number) => boolean;
}

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    if (typeof window === "undefined") return initial("anon_dealer");
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        // dayStartedAt could be stale — keep it; timer will catch up.
        return parsed;
      }
    } catch {
      /* ignore corrupt save */
    }
    const handle = localStorage.getItem("iti.handle") || "anon_dealer";
    return initial(handle);
  });

  /* Hydrate da IndexedDB se localStorage vuoto */
  const idbHydrated = useRef(false);
  useEffect(() => {
    if (idbHydrated.current || typeof window === "undefined") return;
    idbHydrated.current = true;
    if (localStorage.getItem(STORAGE_KEY)) return;
    void loadFromIndexedDB().then((saved) => {
      if (saved) dispatch({ type: "HYDRATE", state: saved });
    });
  }, []);

  /* Carica save cloud al login Supabase */
  const cloudLoadedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) {
      cloudLoadedFor.current = null;
      return;
    }
    if (cloudLoadedFor.current === user.id) return;
    cloudLoadedFor.current = user.id;

    void loadCloudSave(user.id).then((cloud) => {
      if (cloud) {
        dispatch({ type: "HYDRATE", state: cloud });
        return;
      }
      const meta = user.user_metadata?.handle as string | undefined;
      const h =
        meta ||
        user.email?.split("@")[0]?.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 18) ||
        "anon_dealer";
      dispatch({ type: "SET_HANDLE", handle: h });
    });
  }, [user?.id, user?.email, user?.user_metadata]);

  /* Sync cloud (debounced) */
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      void saveCloudSave(user.id, state);
      void upsertCloudLeaderboard(user.id, state);
    }, 1200);
    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [state, user?.id]);

  /* Persist localStorage + IndexedDB + leaderboard locale */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* private mode / quota */
    }
    void saveToIndexedDB(state);
    upsertLeaderboard(state);
  }, [state]);

  /* Decadimento sospetto */
  useEffect(() => {
    if (state.gameOver) return;
    const id = setInterval(() => dispatch({ type: "TICK_SUSPICION" }), SUSPICION_TICK_MS);
    return () => clearInterval(id);
  }, [state.gameOver]);

  /* Avanzamento giorno + countdown */
  const tickRef = useRef(0);
  useEffect(() => {
    if (state.gameOver) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - state.dayStartedAt;
      if (elapsed >= DAY_DURATION_MS) {
        dispatch({ type: "ADVANCE_DAY" });
      } else {
        // re-render every second for the countdown
        tickRef.current++;
        // dummy state update via dispatching a noop-equivalent? We use a separate
        // re-render trick: dispatch suspicion tick is too frequent, so use a
        // local React state via setForce.
        forceUpdate();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [state.dayStartedAt, state.gameOver]);

  const [, forceTick] = useReducer((x: number) => x + 1, 0);
  const forceUpdate = () => forceTick();

  /* Bust automatico a sospetto 100 */
  useEffect(() => {
    if (state.suspicion >= 100 && !state.gameOver) {
      // Lasciato al mini-game (Fase 3) decidere il bust. Per ora:
      // niente auto-bust qui, il route /minigame lo gestirà.
    }
  }, [state.suspicion, state.gameOver]);

  const msUntilNextDay = Math.max(0, DAY_DURATION_MS - (Date.now() - state.dayStartedAt));

  const value = useMemo<Ctx>(
    () => ({
      state,
      msUntilNextDay,
      addToCart: (productId) => dispatch({ type: "ADD_TO_CART", productId }),
      removeFromCart: (productId) => dispatch({ type: "REMOVE_FROM_CART", productId }),
      clearCart: () => dispatch({ type: "CLEAR_CART" }),
      sellInventory: (productId, qty, unitPrice, opts) => {
        if (state.gameOver) return { ok: false, reason: "Game over — riavvia dal terminale" };
        const p = PRODUCTS.find((x) => x.id === productId);
        if (!p) return { ok: false, reason: "Prodotto sconosciuto" };
        const available = getStockQty(state.inventory, productId);
        if (available < qty) {
          return {
            ok: false,
            reason:
              available === 0
                ? `Nessun ${p.name} in stash — compralo nello Shop`
                : `Stock insufficiente (hai ${available}, servono ${qty})`,
          };
        }
        let unit = unitPrice ?? Math.round(p.basePrice * 1.6);
        if (opts?.missionSim) unit = Math.round(unit * simRewardMul());
        const eventRiskMul = state.event?.riskMul ?? 1;
        const simMul = opts?.missionSim ? simRiskMul() : 1;
        const suspicionDelta = p.risk * qty * eventRiskMul * 0.6 * difficultyRiskMul() * simMul;
        dispatch({ type: "SELL", productId, qty, earned: unit * qty, suspicionDelta });
        return { ok: true };
      },
      resolveRaid: (success) => dispatch({ type: "RESOLVE_RAID", success }),
      triggerBust: () => dispatch({ type: "TRIGGER_BUST" }),
      setHandle: (h) => dispatch({ type: "SET_HANDLE", handle: h }),
      resetAfterBust: () => dispatch({ type: "RESET_AFTER_BUST" }),
      toggleHide: (productId) => dispatch({ type: "TOGGLE_HIDE", productId }),
      hideAll: () => dispatch({ type: "HIDE_ALL" }),
      getStockQty: (productId) => getStockQty(state.inventory, productId),
      canFulfill: (productId, qty) => canFulfillStock(state.inventory, productId, qty),
      checkout: () => {
        const cost = state.cart.reduce((sum, line) => {
          const p = PRODUCTS.find((x) => x.id === line.productId);
          return sum + (p?.basePrice ?? 0) * line.qty;
        }, 0);
        if (cost === 0) return { ok: false, reason: "Carrello vuoto" };
        if (cost > state.coins) return { ok: false, reason: "CoperniCoin insufficienti" };
        const eventRiskMul = state.event?.riskMul ?? 1;
        const suspicionDelta =
          state.cart.reduce((sum, line) => {
            const p = PRODUCTS.find((x) => x.id === line.productId);
            return sum + (p?.risk ?? 0) * line.qty * eventRiskMul;
          }, 0) * difficultyRiskMul();
        const soldQty = state.cart.reduce((s, l) => s + l.qty, 0);
        dispatch({ type: "CHECKOUT_SUCCESS", cost, suspicionDelta, soldQty });
        return { ok: true };
      },
    }),
    [state, msUntilNextDay],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be used within <GameProvider>");
  return ctx;
}

/** Helper per formattare ms come mm:ss */
export function formatMs(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
