import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { authRedirectUrl, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { upsertCloudProfile } from "@/game/gameCloud";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithEmail: (
    email: string,
    password: string,
    handle: string,
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signInWithOAuth: (provider: "google" | "github") => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateHandle: (handle: string) => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const sb = supabase();
    if (!sb) return { error: "Supabase non configurato — aggiungi .env.local" };
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string, handle: string) => {
    const sb = supabase();
    if (!sb) return { error: "Supabase non configurato — aggiungi .env.local" };
    const h = handle.trim() || "anon_dealer";
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { handle: h },
        emailRedirectTo: authRedirectUrl(),
      },
    });
    if (error) return { error: error.message };
    if (data.user) await upsertCloudProfile(data.user.id, h);
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "github") => {
    const sb = supabase();
    if (!sb) return { error: "Supabase non configurato — aggiungi .env.local" };
    const { error } = await sb.auth.signInWithOAuth({
      provider,
      options: { redirectTo: authRedirectUrl() },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    const sb = supabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
  }, []);

  const updateHandle = useCallback(async (handle: string) => {
    const sb = supabase();
    if (!sb || !session?.user) return;
    await upsertCloudProfile(session.user.id, handle);
    await sb.auth.updateUser({ data: { handle } });
  }, [session?.user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured: isSupabaseConfigured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      updateHandle,
    }),
    [session, loading, signInWithEmail, signUpWithEmail, signInWithOAuth, signOut, updateHandle],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
