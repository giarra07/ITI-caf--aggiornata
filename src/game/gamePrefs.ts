/** Preferenze globali (audio, notifiche, difficoltà). */

export type Difficulty = "easy" | "normal" | "hard";

export interface GamePrefs {
  music: boolean;
  volume: number;
  sfx: boolean;
  notifications: boolean;
  vibration: boolean;
  difficulty: Difficulty;
  /** Modalità simulazione compiti — bonus CPN, più sospetto */
  simMode: boolean;
}

const KEY = "iti.prefs.v1";
const LEGACY_AUDIO = "iti.audio";

const DEFAULTS: GamePrefs = {
  music: true,
  volume: 1,
  sfx: true,
  notifications: true,
  vibration: true,
  difficulty: "normal",
  simMode: false,
};

export function loadGamePrefs(): GamePrefs {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<GamePrefs>) };
    const legacy = localStorage.getItem(LEGACY_AUDIO);
    if (legacy) {
      const a = JSON.parse(legacy) as { music?: boolean; volume?: number };
      return { ...DEFAULTS, music: a.music ?? true, volume: a.volume ?? 1 };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export function saveGamePrefs(prefs: GamePrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function isSfxEnabled(): boolean {
  return loadGamePrefs().sfx;
}

export function isVibrationEnabled(): boolean {
  return loadGamePrefs().vibration;
}

export function isNotificationsEnabled(): boolean {
  return loadGamePrefs().notifications;
}

/** Moltiplicatore sospetto per difficoltà */
export function difficultyRiskMul(): number {
  const d = loadGamePrefs().difficulty;
  if (d === "easy") return 0.75;
  if (d === "hard") return 1.35;
  return 1;
}

/** Bonus ricompense missioni in sim mode */
export function simRewardMul(): number {
  return loadGamePrefs().simMode ? 1.5 : 1;
}

export function simRiskMul(): number {
  return loadGamePrefs().simMode ? 1.2 : 1;
}
