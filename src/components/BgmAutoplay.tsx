import { useEffect } from "react";
import { loadGamePrefs } from "@/game/gamePrefs";
import { startMusic, isMusicPlaying } from "@/game/audio";

/** Avvia il sottofondo al primo gesto utente (policy browser autoplay). */
export function BgmAutoplay() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const kick = () => {
      const enabled = loadGamePrefs().music;
      if (enabled && !isMusicPlaying()) void startMusic();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };

    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, []);

  return null;
}
