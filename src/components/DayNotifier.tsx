import { useEffect, useRef } from "react";
import { useGame, DAILY_ALLOWANCE } from "@/game/GameContext";
import { isNotificationsEnabled } from "@/game/gamePrefs";

export function DayNotifier() {
  const { state } = useGame();
  const prevDay = useRef(state.day);

  useEffect(() => {
    if (state.day <= prevDay.current) return;
    prevDay.current = state.day;

    if (!isNotificationsEnabled()) return;
    if (typeof Notification === "undefined") return;

    const title = `Giorno ${state.day} · ITI Café`;
    const body = `+${DAILY_ALLOWANCE} CoperniCoin paghetta${state.event ? ` · ${state.event.title}` : ""}`;

    const show = () => {
      try {
        new Notification(title, { body, icon: "/icon-192.png", tag: "iti-day" });
      } catch {
        /* denied */
      }
    };

    if (Notification.permission === "granted") show();
    else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") show();
      });
    }
  }, [state.day, state.event]);

  return null;
}
