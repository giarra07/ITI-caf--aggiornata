/** Backup IndexedDB dello stato di gioco (PRD: cache offline). */

import type { GameState } from "./GameContext";

const DB = "iti-cafe-db";
const STORE = "game";
const KEY = "v1";

export async function saveToIndexedDB(state: GameState): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put(state, KEY);
    });
    db.close();
  } catch {
    /* quota / private mode */
  }
}

export async function loadFromIndexedDB(): Promise<GameState | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const state = await new Promise<GameState | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => resolve((req.result as GameState) ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return state;
  } catch {
    return null;
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
