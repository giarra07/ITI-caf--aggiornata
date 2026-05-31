import type { GameState } from "./GameContext";
import { supabase } from "@/lib/supabase";
import type { LeaderboardEntry } from "./leaderboard";

export async function loadCloudSave(userId: string): Promise<GameState | null> {
  const sb = supabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("game_saves")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data?.state) return null;
  return data.state as GameState;
}

export async function saveCloudSave(userId: string, state: GameState): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  await sb.from("game_saves").upsert({
    user_id: userId,
    state,
    updated_at: new Date().toISOString(),
  });
}

export async function upsertCloudProfile(userId: string, handle: string): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  await sb.from("profiles").upsert({
    id: userId,
    handle,
    updated_at: new Date().toISOString(),
  });
}

export async function fetchCloudLeaderboard(limit = 15): Promise<LeaderboardEntry[]> {
  const sb = supabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("leaderboard")
    .select("handle, total_earned, days_survived, total_sold, updated_at")
    .order("total_earned", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    handle: row.handle,
    totalEarned: row.total_earned,
    daysSurvived: row.days_survived,
    totalSold: row.total_sold,
    at: new Date(row.updated_at).getTime(),
  }));
}

export async function upsertCloudLeaderboard(userId: string, state: GameState): Promise<void> {
  const sb = supabase();
  if (!sb) return;
  await sb.from("leaderboard").upsert({
    user_id: userId,
    handle: state.handle,
    total_earned: state.stats.totalEarned,
    days_survived: state.stats.daysSurvived,
    total_sold: state.stats.totalSold,
    updated_at: new Date().toISOString(),
  });
}
