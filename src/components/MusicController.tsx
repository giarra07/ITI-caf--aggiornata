import { useEffect, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { startMusic, stopMusic, setMusicVolume, isMusicPlaying } from "@/game/audio";
import { loadGamePrefs, saveGamePrefs, type GamePrefs } from "@/game/gamePrefs";

export function useGamePrefs() {
  const [prefs, setPrefs] = useState<GamePrefs>(loadGamePrefs);

  const setPrefsPatch = (patch: Partial<GamePrefs> | ((p: GamePrefs) => GamePrefs)) => {
    setPrefs((prev) => {
      const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
      saveGamePrefs(next);
      return next;
    });
  };

  useEffect(() => {
    setMusicVolume(prefs.volume);
    if (prefs.music && !isMusicPlaying()) void startMusic();
    if (!prefs.music) stopMusic();
  }, [prefs.music, prefs.volume]);

  return [prefs, setPrefsPatch] as const;
}

/** Floating toggle — anche avvia AudioContext al primo gesto */
export function MusicToggle() {
  const [prefs, setPrefs] = useGamePrefs();
  return (
    <button
      onClick={() => setPrefs((p) => ({ ...p, music: !p.music }))}
      className="fixed top-2 right-2 z-50 rounded-sm border border-primary/40 bg-silicon-black/80 backdrop-blur px-2 py-1.5 font-mono text-[10px] text-primary hover:border-primary inline-flex items-center gap-1"
      aria-label={prefs.music ? "spegni musica" : "accendi musica"}
      title="Three Little Birds — Bob Marley"
    >
      {prefs.music ? <Music size={12} className="text-glow" /> : <VolumeX size={12} />}
      <span>{prefs.music ? "♪" : "off"}</span>
    </button>
  );
}
