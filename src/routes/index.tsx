import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MatrixRain } from "@/components/MatrixRain";
import { LeafIcon } from "@/components/LeafIcon";
import { useAuth } from "@/auth/AuthContext";
import { useGame } from "@/game/GameContext";
import { playClick, playWin7Error } from "@/game/audio";
import rastaHacker from "@/assets/rasta-hacker.png";

export const Route = createFileRoute("/")({
  component: BootScreen,
});

const BOOT_LINES = [
  "[ok] mounting /dev/copernico ........................ acid-green",
  "[ok] loading rasta-stack ............................ 3lb.lofi.wav",
  "[ok] initializing pizzini.exe socket ................ ready",
  "[ok] calibrating campanella sensor .................. armed",
  "[ok] supabase auth .................................. linked",
  "[ok] welcome, studente. // Open Laptop, get high and write code",
];

function BootScreen() {
  const navigate = useNavigate();
  const { user, loading, configured, signInWithEmail, signUpWithEmail, signInWithOAuth } =
    useAuth();
  const { setHandle } = useGame();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setLocalHandle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step >= BOOT_LINES.length) return;
    const id = setTimeout(() => setStep((s) => s + 1), step === 0 ? 250 : 380);
    return () => clearTimeout(id);
  }, [step]);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [loading, user, navigate]);

  const ready = step >= BOOT_LINES.length;
  const useCloud = configured;

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    playClick();

    if (!useCloud) {
      const h = handle.trim() || "anon_dealer";
      setHandle(h);
      try {
        localStorage.setItem("iti.handle", h);
      } catch {
        /* ignore */
      }
      navigate({ to: "/dashboard" });
      setBusy(false);
      return;
    }

    if (!email.trim() || password.length < 6) {
      playWin7Error();
      setErr("Email valida e password min. 6 caratteri");
      setBusy(false);
      return;
    }

    if (mode === "login") {
      const res = await signInWithEmail(email.trim(), password);
      if (res.error) {
        playWin7Error();
        setErr(res.error);
      } else {
        navigate({ to: "/dashboard" });
      }
    } else {
      const h = handle.trim() || email.split("@")[0] || "anon_dealer";
      const res = await signUpWithEmail(email.trim(), password, h);
      if (res.error) {
        playWin7Error();
        setErr(res.error);
      } else if (res.needsConfirmation) {
        setInfo("Controlla la email per confermare l'account, poi fai login.");
      } else {
        setHandle(h);
        navigate({ to: "/dashboard" });
      }
    }
    setBusy(false);
  };

  const oauth = async (provider: "google" | "github") => {
    setErr(null);
    playClick();
    const res = await signInWithOAuth(provider);
    if (res.error) {
      playWin7Error();
      setErr(res.error);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-silicon-black text-primary">
      <MatrixRain />
      <div className="scanlines fixed inset-0 z-10" aria-hidden />

      <section className="relative z-20 mx-auto flex min-h-screen max-w-xl flex-col px-5 py-8 font-mono">
        <div className="flex items-baseline justify-between text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <span>iti-copernico · tor v6.6.6</span>
          <span className="text-secondary text-glow-yellow flicker">● live</span>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <img
            src={rastaHacker}
            alt="Rasta hacker pixel art"
            width={120}
            height={120}
            className="h-28 w-28 shrink-0 object-contain drop-shadow-[0_0_22px_rgba(0,255,65,0.45)]"
          />
          <div className="min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-primary text-glow">
              The ITI <span className="text-secondary text-glow-yellow">Café</span>
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              <span className="text-destructive">// </span>
              Open Laptop, get high and write code
            </p>
          </div>
        </div>

        <LeafIcon
          size={70}
          className="pointer-events-none absolute top-32 right-4 text-primary/30 rotate-12"
        />

        <pre className="mt-8 terminal-border rounded-sm bg-card/60 p-4 text-[11px] leading-relaxed text-primary/90 overflow-hidden max-h-40">
          {BOOT_LINES.slice(0, step).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
          {!ready && (
            <div className="text-secondary">
              running diagnostics
              <span className="caret" />
            </div>
          )}
        </pre>

        {ready && (
          <form className="mt-6 space-y-3" onSubmit={submitEmail}>
            {useCloud ? (
              <>
                <div className="flex gap-2">
                  {(["login", "register"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-sm border py-2 text-[10px] uppercase tracking-widest ${mode === m ? "border-primary bg-primary/15 text-primary" : "border-primary/30 text-muted-foreground"}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                  email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full terminal-border rounded-sm bg-card/70 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="studente@iti.copernico.it"
                />

                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                  password
                </label>
                <input
                  type="password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full terminal-border rounded-sm bg-card/70 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="••••••••"
                />

                {mode === "register" && (
                  <>
                    <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                      codename (nickname)
                    </label>
                    <input
                      value={handle}
                      onChange={(e) =>
                        setLocalHandle(
                          e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 18),
                        )
                      }
                      className="w-full terminal-border rounded-sm bg-card/70 px-3 py-2.5 text-sm outline-none focus:border-primary"
                      placeholder="er_pacioccone_420"
                    />
                  </>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => oauth("google")}
                    className="rounded-sm border border-primary/50 py-2 text-[10px] uppercase hover:bg-primary/10"
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => oauth("github")}
                    className="rounded-sm border border-primary/50 py-2 text-[10px] uppercase hover:bg-primary/10"
                  >
                    GitHub
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[10px] text-secondary">
                  [!] Supabase offline — modalità locale. Aggiungi .env.local per cloud save.
                </p>
                <label className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                  codename
                </label>
                <input
                  value={handle}
                  onChange={(e) =>
                    setLocalHandle(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 18))
                  }
                  className="w-full terminal-border rounded-sm bg-card/70 px-3 py-2.5 text-sm outline-none"
                  placeholder="anon_dealer"
                />
              </>
            )}

            {err && <p className="text-[11px] text-destructive text-glow-red">[err] {err}</p>}
            {info && <p className="text-[11px] text-secondary">[info] {info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-sm border-2 border-primary bg-primary/10 px-4 py-3 text-sm font-bold uppercase tracking-widest text-primary text-glow hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            >
              &gt;_ enter terminal
            </button>
          </form>
        )}

        <div className="mt-auto pt-8 text-[10px] text-muted-foreground/70 text-center">
          v1.0.0 — cloud save {useCloud ? "ON" : "OFF"}
        </div>
      </section>
    </main>
  );
}
