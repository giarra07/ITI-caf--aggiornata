/** Chiavi localStorage per il flusso utente (PRD §7). */
const TUTORIAL_KEY = "iti.flow.tutorial.v1";
const LAST_DAY_KEY = "iti.flow.last_day_notice";

export function isTutorialComplete(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "done";
  } catch {
    return true; /* storage blocked */
  }
}

export function completeTutorial(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, "done");
  } catch {
    /* ignore */
  }
}

/** Ultimo giorno per cui è già stato mostrato il banner paghetta. */
export function getLastDayNotice(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(LAST_DAY_KEY) || "0");
  } catch {
    return 0; /* storage blocked */
  }
}

export function setLastDayNotice(day: number): void {
  try {
    localStorage.setItem(LAST_DAY_KEY, String(day));
  } catch {
    /* ignore */
  }
}
