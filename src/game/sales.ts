import { PRODUCTS, type Product } from "./products";
import type { InventoryLine } from "./GameContext";

export function newSaleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Quantità vendibile in stash (nascosto o esposto). */
export function getStockQty(inventory: InventoryLine[], productId: string): number {
  return inventory.find((l) => l.productId === productId)?.qty ?? 0;
}

export function canFulfill(inventory: InventoryLine[], productId: string, qty: number): boolean {
  return getStockQty(inventory, productId) >= qty;
}

export function totalStockUnits(inventory: InventoryLine[]): number {
  return inventory.reduce((s, l) => s + l.qty, 0);
}

/** Ordine casuale — il giocatore deve anticipare la domanda e comprare allo Shop. */
export function pickRandomOrder(): { product: Product; qty: number } {
  const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]!;
  const qty = 1 + Math.floor(Math.random() * 3);
  return { product, qty };
}

/** Prezzo offerto dal cliente (markup sul basePrice). */
export function calcOfferPrice(product: Product, markupMin = 1.4, markupMax = 2.2): number {
  const markup = markupMin + Math.random() * (markupMax - markupMin);
  return Math.max(1, Math.round(product.basePrice * markup));
}

/** Ricompensa missione (bonus più alto). */
export function calcMissionReward(product: Product): number {
  return Math.round(product.basePrice * (2 + Math.random()));
}
