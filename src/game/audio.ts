import { isSfxEnabled } from "./gamePrefs";

/**
 * Web Audio — effetti sintetizzati + musica di sottofondo.
 * Musica: se presente un file in /public/audio/, viene riprodotto in loop;
 * altrimenti fallback 8-bit (melodia ispirata a Three Little Birds).
 *
 * Per la traccia reale (senza copyright), aggiungi ad es.:
 *   public/audio/three-little-birds.mp3
 */
let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
    } catch {
      return null;
    }
  }
  return ctx;
}

function beep(freq: number, start: number, dur: number, gain = 0.18) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + start + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + dur + 0.05);
}

/** Pseudo Windows 7 error chord — two descending sines. */
export function playWin7Error() {
  if (!isSfxEnabled()) return;
  beep(880, 0, 0.18);
  beep(660, 0.12, 0.22);
}

/** Soft confirm click. */
export function playClick() {
  if (!isSfxEnabled()) return;
  beep(1200, 0, 0.05, 0.08);
}

/** Coin pickup-style chirp. */
export function playCoin() {
  if (!isSfxEnabled()) return;
  beep(880, 0, 0.06, 0.1);
  beep(1320, 0.05, 0.1, 0.1);
}

/* ------------------------------------------------------------------ */
/*  Background music — file MP3/OGG oppure chiptune fallback          */
/* ------------------------------------------------------------------ */

const TRACK_CANDIDATES = [
  "/audio/three-little-birds.mp3",
  "/audio/three-little-birds.ogg",
  "/audio/three-little-birds.webm",
];

const NOTE: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  REST: 0,
};

const MELODY: Array<[string, number]> = [
  ["E5", 0.25],
  ["E5", 0.25],
  ["G5", 0.25],
  ["E5", 0.25],
  ["D5", 0.5],
  ["REST", 0.25],
  ["D5", 0.25],
  ["E5", 0.25],
  ["D5", 0.25],
  ["C5", 0.5],
  ["REST", 0.5],
  ["C5", 0.25],
  ["D5", 0.25],
  ["E5", 0.25],
  ["G5", 0.25],
  ["E5", 0.5],
  ["D5", 0.5],
  ["C5", 0.5],
  ["REST", 0.5],
  ["G4", 0.25],
  ["A4", 0.25],
  ["C5", 0.25],
  ["E5", 0.25],
  ["D5", 0.5],
  ["C5", 0.5],
  ["REST", 1.0],
];

const BASS: Array<[string, number]> = [
  ["C4", 0.5],
  ["G4", 0.5],
  ["C4", 0.5],
  ["G4", 0.5],
  ["F4", 0.5],
  ["C4", 0.5],
  ["G4", 0.5],
  ["C4", 0.5],
];

let musicGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setTimeout> | null = null;
let musicPlaying = false;
let musicVolume = 0.08;

let fileAudio: HTMLAudioElement | null = null;
let fileTrackSrc: string | null = null;
let fileProbeDone = false;

function scheduleSquare(freq: number, when: number, dur: number, gain: number) {
  const ac = getCtx();
  if (!ac || !musicGain) return;
  if (freq === 0) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.95);
  osc.connect(g).connect(musicGain);
  osc.start(when);
  osc.stop(when + dur);
}

function playChiptuneLoop() {
  const ac = getCtx();
  if (!ac || !musicPlaying || fileTrackSrc) return;
  const tempo = 0.45;
  let t = ac.currentTime + 0.05;
  const startT = t;
  for (const [n, d] of MELODY) {
    scheduleSquare(NOTE[n] ?? 0, t, d * tempo, 0.6);
    t += d * tempo;
  }
  let bt = startT;
  while (bt < t) {
    for (const [n, d] of BASS) {
      scheduleSquare(NOTE[n] ?? 0, bt, d * tempo, 0.35);
      bt += d * tempo;
      if (bt >= t) break;
    }
  }
  const loopMs = (t - startT) * 1000;
  musicTimer = setTimeout(playChiptuneLoop, loopMs);
}

function stopChiptune() {
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

function loadAudioFile(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    const timeout = window.setTimeout(() => reject(new Error("timeout")), 12_000);
    const done = (fn: () => void) => {
      window.clearTimeout(timeout);
      fn();
    };
    audio.addEventListener("canplaythrough", () => done(() => resolve(audio)), { once: true });
    audio.addEventListener("error", () => done(() => reject(new Error("load failed"))), {
      once: true,
    });
    audio.src = src;
    audio.load();
  });
}

async function probeFileTrack(): Promise<string | null> {
  if (fileProbeDone) return fileTrackSrc;
  fileProbeDone = true;
  for (const src of TRACK_CANDIDATES) {
    try {
      const audio = await loadAudioFile(src);
      fileAudio = audio;
      fileTrackSrc = src;
      return src;
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

function playFileTrack() {
  if (!fileAudio) return;
  fileAudio.volume = musicVolume;
  fileAudio.play().catch(() => {});
}

function pauseFileTrack() {
  if (!fileAudio) return;
  fileAudio.pause();
}

export async function startMusic() {
  const ac = getCtx();
  if (ac?.state === "suspended") ac.resume().catch(() => {});
  if (musicPlaying) return;

  const src = await probeFileTrack();
  musicPlaying = true;

  if (src && fileAudio) {
    playFileTrack();
    return;
  }

  if (!ac) return;
  if (!musicGain) {
    musicGain = ac.createGain();
    musicGain.gain.value = musicVolume;
    musicGain.connect(ac.destination);
  } else {
    musicGain.gain.value = musicVolume;
  }
  playChiptuneLoop();
}

export function stopMusic() {
  musicPlaying = false;
  stopChiptune();
  pauseFileTrack();
  if (musicGain) musicGain.gain.value = 0;
}

export function setMusicVolume(v: number) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (fileAudio) fileAudio.volume = musicVolume;
  if (musicGain) musicGain.gain.value = musicVolume;
}

export function isMusicPlaying() {
  return musicPlaying;
}

/** true se è in riproduzione un file da /public/audio/ */
export function isFileTrackActive() {
  return Boolean(fileTrackSrc && musicPlaying);
}
