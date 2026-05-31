import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anon);

/** Client Supabase — null se env mancanti (fallback locale). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  return createClient(url!, anon!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/** Singleton browser client */
let client: SupabaseClient | null | undefined;

export function supabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client === undefined) client = getSupabase();
  return client;
}

export function authRedirectUrl(): string {
  if (typeof window === "undefined") return "/auth/callback";
  return `${window.location.origin}/auth/callback`;
}
