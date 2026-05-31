import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TerminalHeader } from "@/components/TerminalHeader";
import { BottomNav } from "@/components/BottomNav";
import { useGamePrefs } from "@/components/MusicController";
import { useAuth } from "@/auth/AuthContext";
import { useGame } from "@/game/GameContext";
import { playClick } from "@/game/audio";
import type { Difficulty } from "@/game/gamePrefs";
import { Music, Volume2, Download, Trash2, User, Bell, Vibrate, Zap, LogOut } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · The ITI Café" },
      { name: "description", content: "Configurazione audio, PWA e account per The ITI Café." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setHandle, resetAfterBust } = useGame();
  const { user, signOut, updateHandle, configured } = useAuth();
  const [prefs, setPrefs] = useGamePrefs();
  const [handle, setLocalHandle] = useState(state.handle);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    const res = await installEvt.userChoice.catch(() => null);
    if (res?.outcome === "accepted") setInstalled(true);
    setInstallEvt(null);
  };

  const saveHandle = () => {
    const h =
      handle
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .slice(0, 24) || "anon_dealer";
    setHandle(h);
    try {
      localStorage.setItem("iti.handle", h);
    } catch {
      /* ignore */
    }
    if (user) void updateHandle(h);
    setLocalHandle(h);
    playClick();
  };

  const logout = async () => {
    playClick();
    await signOut();
    location.href = "/";
  };

  const wipe = () => {
    if (!confirm("kernel.format() — cancellare tutti i dati e ricominciare?")) return;
    try {
      localStorage.removeItem("iti.game.v1");
    } catch {
      /* ignore */
    }
    resetAfterBust();
    location.reload();
  };

  return (
    <div className="relative min-h-screen bg-silicon-black pb-24 text-primary">
      <div className="scanlines fixed inset-0 z-0" aria-hidden />
      <TerminalHeader />
      <main className="relative z-10 mx-auto max-w-xl px-4 py-5 space-y-4 font-mono">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            // /etc/config
          </p>
          <h1 className="text-xl text-primary text-glow">$ nano settings.conf</h1>
        </div>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-3">
          <header className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Music size={12} /> audio
          </header>
          <label className="flex items-center justify-between text-xs">
            <span>// Three Little Birds — Bob Marley</span>
            <button
              onClick={() => setPrefs((p) => ({ ...p, music: !p.music }))}
              className={`px-2 py-1 rounded-sm border text-[10px] uppercase ${prefs.music ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}
            >
              {prefs.music ? "on" : "off"}
            </button>
          </label>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Volume2 size={11} /> volume
              </span>
              <span className="text-primary">{Math.round(prefs.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={prefs.volume}
              onChange={(e) => setPrefs((p) => ({ ...p, volume: parseFloat(e.target.value) }))}
              className="w-full accent-primary"
            />
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            // sottofondo in loop ·{" "}
            <span className="text-primary">public/audio/three-little-birds.mp3</span>
          </p>
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-3">
          <header className="text-[10px] uppercase tracking-widest text-muted-foreground">
            // sfx & feedback
          </header>
          <label className="flex items-center justify-between text-xs">
            <span>// effetti win7 + click</span>
            <button
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, sfx: !p.sfx }))}
              className={`px-2 py-1 rounded-sm border text-[10px] uppercase ${prefs.sfx ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}
            >
              {prefs.sfx ? "on" : "off"}
            </button>
          </label>
          <label className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Bell size={11} /> notifiche giorno
            </span>
            <button
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, notifications: !p.notifications }))}
              className={`px-2 py-1 rounded-sm border text-[10px] uppercase ${prefs.notifications ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}
            >
              {prefs.notifications ? "on" : "off"}
            </button>
          </label>
          <label className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1">
              <Vibrate size={11} /> vibrazione raid
            </span>
            <button
              type="button"
              onClick={() => setPrefs((p) => ({ ...p, vibration: !p.vibration }))}
              className={`px-2 py-1 rounded-sm border text-[10px] uppercase ${prefs.vibration ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/40 text-muted-foreground"}`}
            >
              {prefs.vibration ? "on" : "off"}
            </button>
          </label>
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
          <header className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Zap size={12} /> difficoltà
          </header>
          <div className="flex gap-2">
            {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, difficulty: d }))}
                className={`flex-1 rounded-sm border px-2 py-1.5 text-[10px] uppercase ${prefs.difficulty === d ? "border-secondary bg-secondary/15 text-secondary" : "border-primary/30 text-muted-foreground hover:text-primary"}`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            // easy = meno sospetto · hard = preside iper-vigile
          </p>
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
          <header className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <User size={12} /> codename
          </header>
          <div className="flex gap-2">
            <input
              value={handle}
              onChange={(e) => setLocalHandle(e.target.value)}
              maxLength={24}
              className="flex-1 bg-silicon-black border border-primary/40 rounded-sm px-2 py-1 text-xs text-primary outline-none focus:border-primary"
              placeholder="anon_dealer"
            />
            <button
              onClick={saveHandle}
              className="rounded-sm border border-primary bg-primary/10 px-3 py-1 text-[11px] uppercase text-primary hover:bg-primary hover:text-primary-foreground"
            >
              save
            </button>
          </div>
        </section>

        <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
          <header className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Download size={12} /> install pwa
          </header>
          {installed ? (
            <p className="text-xs text-primary">[ok] app installata sul dispositivo</p>
          ) : installEvt ? (
            <button
              onClick={install}
              className="w-full rounded-sm border border-secondary bg-secondary/10 px-2 py-2 text-xs uppercase tracking-widest text-secondary hover:bg-secondary hover:text-secondary-foreground"
            >
              $ apt install iti-cafe
            </button>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              // installazione non disponibile su questo browser. Usa "Aggiungi alla schermata Home"
              dal menu del browser.
            </p>
          )}
        </section>

        {configured && user && (
          <section className="terminal-border rounded-sm bg-card/60 p-3 space-y-2">
            <header className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <LogOut size={12} /> sessione cloud
            </header>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-sm border border-destructive/50 py-2 text-[11px] uppercase text-destructive hover:bg-destructive/10"
            >
              $ logout
            </button>
          </section>
        )}

        <section className="terminal-border rounded-sm border-destructive/50 bg-destructive/5 p-3 space-y-2">
          <header className="text-[10px] uppercase tracking-widest text-destructive flex items-center gap-1.5">
            <Trash2 size={12} /> danger zone
          </header>
          <button
            onClick={wipe}
            className="w-full rounded-sm border border-destructive bg-destructive/10 px-2 py-2 text-xs uppercase tracking-widest text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            $ rm -rf /stash
          </button>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
