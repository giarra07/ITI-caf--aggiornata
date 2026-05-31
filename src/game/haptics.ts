import { isVibrationEnabled } from "./gamePrefs";

export function vibrateAlert(pattern: number | number[] = [80, 40, 80]): void {
  if (typeof navigator === "undefined" || !isVibrationEnabled()) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
