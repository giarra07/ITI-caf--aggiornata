import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/auth/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase";

const PUBLIC = new Set(["/", "/auth/callback"]);

/** Reindirizza al login se Supabase è attivo e l'utente non è autenticato. */
export function AuthGate() {
  const { user, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured || loading) return;
    if (!user && !PUBLIC.has(path)) {
      navigate({ to: "/" });
    }
  }, [user, loading, path, navigate]);

  return null;
}
