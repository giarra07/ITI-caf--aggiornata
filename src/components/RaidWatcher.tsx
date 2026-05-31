import { useEffect } from "react";
import { useRouter, useLocation } from "@tanstack/react-router";
import { useGame } from "@/game/GameContext";
import { vibrateAlert } from "@/game/haptics";

/**
 * Sorveglia lo stato di gioco e dirotta il giocatore verso /minigame
 * quando il sospetto sfora 90, oppure verso /game-over quando viene
 * sgamato definitivamente.
 */
export function RaidWatcher() {
  const { state } = useGame();
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (state.gameOver && path !== "/game-over") {
      router.navigate({ to: "/game-over" });
      return;
    }
    // PRD §7: mini-game automatico al sospetto massimo (≥100)
    if (
      !state.gameOver &&
      state.suspicion >= 100 &&
      path !== "/minigame" &&
      path !== "/game-over"
    ) {
      vibrateAlert([120, 60, 120, 60, 200]);
      router.navigate({ to: "/minigame" });
    }
  }, [state.suspicion, state.gameOver, location.pathname, router]);

  return null;
}
