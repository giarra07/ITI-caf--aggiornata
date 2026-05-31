import type { GameState } from "./GameContext";

export interface LeaderboardEntry {
  handle: string;
  totalEarned: number;
  daysSurvived: number;
  totalSold: number;
  at: number;
}

const KEY = "iti.leaderboard.v1";
const MAX = 15;

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    /* ignore */
  }
  return [];
}

export function upsertLeaderboard(state: GameState): void {
  if (!state.handle) return;
  const board = loadLeaderboard().filter((e) => e.handle !== state.handle);
  board.push({
    handle: state.handle,
    totalEarned: state.stats.totalEarned,
    daysSurvived: state.stats.daysSurvived,
    totalSold: state.stats.totalSold,
    at: Date.now(),
  });
  board.sort((a, b) => b.totalEarned - a.totalEarned || b.daysSurvived - a.daysSurvived);
  try {
    localStorage.setItem(KEY, JSON.stringify(board.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export { fetchCloudLeaderboard } from "./gameCloud";
