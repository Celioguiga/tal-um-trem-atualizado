/* ── Biblioteca de Instrumentos — SoundFont (smplr) + fallback sintetizado ── */

import { Soundfont, type Soundfont as SoundfontInstance, HttpStorage } from "smplr";

export type InstrumentDef = {
  id: string;
  nome: string;
  categoria: "teclado" | "corda" | "sopro" | "madeira" | "baixo";
  icon: string;
  /* Nome no SoundFont MusyngKite (smplr) — null = apenas sintetizado */
  sfName: string | null;
  /* Configuracao de sintese (fallback / baixo latency) */
  oscillators: {
    type: OscillatorType;
    freqMult: number;
    gain: number;
    detune?: number;
  }[];
  adsr: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
  filter?: {
    type: BiquadFilterType;
    freq: number;
    Q: number;
  };
  vibrato?: {
    freq: number;
    depth: number;
    delay: number;
  };
  maxDuration?: number;
};

export const INSTRUMENTS: InstrumentDef[] = [
  {
    id: "piano",
    nome: "Piano",
    categoria: "teclado",
    icon: "🎹",
    sfName: "acoustic_grand_piano",
    oscillators: [
      { type: "triangle", freqMult: 1, gain: 0.6 },
      { type: "sine", freqMult: 2, gain: 0.15 },
      { type: "sine", freqMult: 3, gain: 0.08 },
    ],
    adsr: { attack: 0.005, decay: 0.3, sustain: 0.3, release: 0.4 },
    filter: { type: "lowpass", freq: 5000, Q: 0.5 },
    maxDuration: 8,
  },
  {
    id: "harmonium",
    nome: "Harmonium",
    categoria: "teclado",
    icon: "🎹",
    sfName: "reed_organ",
    oscillators: [
      { type: "sawtooth", freqMult: 1, gain: 0.4 },
      { type: "sine", freqMult: 1.005, gain: 0.3 },
      { type: "sine", freqMult: 2, gain: 0.2 },
    ],
    adsr: { attack: 0.08, decay: 0.1, sustain: 0.8, release: 0.3 },
    filter: { type: "lowpass", freq: 3000, Q: 1 },
    vibrato: { freq: 5, depth: 3, delay: 0.1 },
  },
  {
    id: "orgao",
    nome: "Orgao",
    categoria: "teclado",
    icon: "🎹",
    sfName: "church_organ",
    oscillators: [
      { type: "sine", freqMult: 1, gain: 0.35 },
      { type: "sine", freqMult: 2, gain: 0.25 },
      { type: "sine", freqMult: 3, gain: 0.2 },
      { type: "sine", freqMult: 0.5, gain: 0.2 },
    ],
    adsr: { attack: 0.02, decay: 0.05, sustain: 0.9, release: 0.15 },
    filter: { type: "lowpass", freq: 4000, Q: 0.3 },
  },
  {
    id: "flauta_doce",
    nome: "Flauta Doce",
    categoria: "sopro",
    icon: "🎵",
    sfName: "recorder",
    oscillators: [
      { type: "sine", freqMult: 1, gain: 0.6 },
      { type: "sine", freqMult: 2, gain: 0.1 },
      { type: "triangle", freqMult: 1, gain: 0.15, detune: 5 },
    ],
    adsr: { attack: 0.05, decay: 0.05, sustain: 0.85, release: 0.2 },
    filter: { type: "lowpass", freq: 3500, Q: 0.8 },
    vibrato: { freq: 5.5, depth: 4, delay: 0.15 },
  },
  {
    id: "flauta_trans",
    nome: "Flauta Transversal",
    categoria: "sopro",
    icon: "🎵",
    sfName: "flute",
    oscillators: [
      { type: "sine", freqMult: 1, gain: 0.5 },
      { type: "triangle", freqMult: 1, gain: 0.2, detune: 3 },
      { type: "sine", freqMult: 2, gain: 0.08 },
    ],
    adsr: { attack: 0.06, decay: 0.08, sustain: 0.8, release: 0.25 },
    filter: { type: "lowpass", freq: 6000, Q: 0.5 },
    vibrato: { freq: 5, depth: 6, delay: 0.2 },
  },
  {
    id: "violino",
    nome: "Violino",
    categoria: "corda",
    icon: "🎻",
    sfName: "violin",
    oscillators: [
      { type: "sawtooth", freqMult: 1, gain: 0.35 },
      { type: "sawtooth", freqMult: 1.003, gain: 0.25 },
      { type: "sawtooth", freqMult: 0.997, gain: 0.2 },
      { type: "sine", freqMult: 2, gain: 0.1 },
    ],
    adsr: { attack: 0.12, decay: 0.1, sustain: 0.75, release: 0.3 },
    filter: { type: "lowpass", freq: 4500, Q: 1.5 },
    vibrato: { freq: 6, depth: 8, delay: 0.25 },
  },
  {
    id: "viola",
    nome: "Viola de Orquestra",
    categoria: "corda",
    icon: "🎻",
    sfName: "viola",
    oscillators: [
      { type: "sawtooth", freqMult: 1, gain: 0.35 },
      { type: "sawtooth", freqMult: 1.004, gain: 0.25 },
      { type: "sawtooth", freqMult: 0.996, gain: 0.2 },
      { type: "sine", freqMult: 2, gain: 0.08 },
    ],
    adsr: { attack: 0.14, decay: 0.12, sustain: 0.7, release: 0.35 },
    filter: { type: "lowpass", freq: 3800, Q: 1.2 },
    vibrato: { freq: 5.5, depth: 7, delay: 0.3 },
  },
  {
    id: "baixo_pizz",
    nome: "Baixo Acustico (Pizzicato)",
    categoria: "baixo",
    icon: "🎻",
    sfName: "pizzicato_strings",
    oscillators: [
      { type: "triangle", freqMult: 1, gain: 0.5 },
      { type: "sine", freqMult: 2, gain: 0.15 },
      { type: "sine", freqMult: 0.5, gain: 0.2 },
    ],
    adsr: { attack: 0.003, decay: 0.15, sustain: 0.05, release: 0.2 },
    filter: { type: "lowpass", freq: 1200, Q: 0.5 },
    maxDuration: 1.5,
  },
  {
    id: "baixo_arco",
    nome: "Baixo de Arco",
    categoria: "baixo",
    icon: "🎻",
    sfName: "contrabass",
    oscillators: [
      { type: "sawtooth", freqMult: 1, gain: 0.4 },
      { type: "sawtooth", freqMult: 1.002, gain: 0.25 },
      { type: "sine", freqMult: 0.5, gain: 0.3 },
    ],
    adsr: { attack: 0.15, decay: 0.15, sustain: 0.7, release: 0.4 },
    filter: { type: "lowpass", freq: 1500, Q: 1 },
    vibrato: { freq: 4.5, depth: 5, delay: 0.3 },
  },
  {
    id: "cello",
    nome: "Violoncello",
    categoria: "corda",
    icon: "🎻",
    sfName: "cello",
    oscillators: [
      { type: "sawtooth", freqMult: 1, gain: 0.38 },
      { type: "sawtooth", freqMult: 1.004, gain: 0.22 },
      { type: "sine", freqMult: 0.5, gain: 0.15 },
      { type: "sine", freqMult: 2, gain: 0.1 },
    ],
    adsr: { attack: 0.13, decay: 0.12, sustain: 0.72, release: 0.35 },
    filter: { type: "lowpass", freq: 2800, Q: 1 },
    vibrato: { freq: 5, depth: 6, delay: 0.28 },
  },
  {
    id: "violao",
    nome: "Violao (Nylon)",
    categoria: "corda",
    icon: "🎸",
    sfName: "acoustic_guitar_nylon",
    oscillators: [
      { type: "triangle", freqMult: 1, gain: 0.45 },
      { type: "sawtooth", freqMult: 1, gain: 0.15, detune: 8 },
      { type: "sine", freqMult: 2, gain: 0.12 },
    ],
    adsr: { attack: 0.004, decay: 0.4, sustain: 0.2, release: 0.5 },
    filter: { type: "lowpass", freq: 3500, Q: 0.8 },
    maxDuration: 6,
  },
  {
    id: "ukulele",
    nome: "Ukulele",
    categoria: "corda",
    icon: "🎸",
    sfName: "acoustic_guitar_steel",
    oscillators: [
      { type: "triangle", freqMult: 1, gain: 0.5 },
      { type: "sine", freqMult: 2, gain: 0.15 },
      { type: "sine", freqMult: 3, gain: 0.08 },
    ],
    adsr: { attack: 0.002, decay: 0.25, sustain: 0.1, release: 0.3 },
    filter: { type: "lowpass", freq: 4500, Q: 0.6 },
    maxDuration: 3,
  },
  {
    id: "xilofone",
    nome: "Xilofone",
    categoria: "madeira",
    icon: "🎵",
    sfName: "xylophone",
    oscillators: [
      { type: "sine", freqMult: 1, gain: 0.5 },
      { type: "sine", freqMult: 3.5, gain: 0.2 },
      { type: "sine", freqMult: 6.5, gain: 0.08 },
    ],
    adsr: { attack: 0.001, decay: 0.3, sustain: 0.0, release: 0.3 },
    filter: { type: "bandpass", freq: 2000, Q: 2 },
    maxDuration: 1.5,
  },
  {
    id: "metalofone",
    nome: "Metalofone (Glockenspiel)",
    categoria: "madeira",
    icon: "🎵",
    sfName: "glockenspiel",
    oscillators: [
      { type: "sine", freqMult: 1, gain: 0.45 },
      { type: "sine", freqMult: 2.76, gain: 0.25 },
      { type: "sine", freqMult: 5.4, gain: 0.12 },
    ],
    adsr: { attack: 0.002, decay: 0.5, sustain: 0.0, release: 0.5 },
    filter: { type: "bandpass", freq: 3000, Q: 1.5 },
    maxDuration: 2.5,
  },
  {
    id: "marimba",
    nome: "Marimba",
    categoria: "madeira",
    icon: "🎵",
    sfName: "marimba",
    oscillators: [
      { type: "sine", freqMult: 1, gain: 0.5 },
      { type: "sine", freqMult: 4, gain: 0.15 },
      { type: "sine", freqMult: 9.5, gain: 0.05 },
    ],
    adsr: { attack: 0.003, decay: 0.6, sustain: 0.0, release: 0.4 },
    filter: { type: "bandpass", freq: 2500, Q: 1 },
    maxDuration: 2,
  },
];

export const INSTRUMENT_MAP: Record<string, InstrumentDef> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.id, i])
);

export function getInstrument(id: string): InstrumentDef {
  return INSTRUMENT_MAP[id] || INSTRUMENTS[0];
}

/* ── Gerenciador de SoundFonts (smplr) ── */

const sfCache = new Map<string, SoundfontInstance>();
const sfLoading = new Map<string, Promise<SoundfontInstance>>();

export function loadSoundfont(
  instrumentId: string,
  ctx: AudioContext,
  destination: AudioNode,
  onProgress?: (loaded: number, total: number) => void
): Promise<SoundfontInstance> {
  const inst = getInstrument(instrumentId);
  if (!inst.sfName) return Promise.reject(new Error("Instrumento sem SoundFont"));

  const cacheKey = inst.sfName;
  if (sfCache.has(cacheKey)) return Promise.resolve(sfCache.get(cacheKey)!);
  if (sfLoading.has(cacheKey)) return sfLoading.get(cacheKey)!;

  const sf = Soundfont({
    instrument: inst.sfName,
    kit: "MusyngKite",
    storage: HttpStorage,
    destination,
    onLoadProgress: (p) => onProgress?.(p.loaded, p.total),
  });

  const promise = sf.load().then(() => {
    sfCache.set(cacheKey, sf);
    sfLoading.delete(cacheKey);
    return sf;
  }).catch((err) => {
    sfLoading.delete(cacheKey);
    throw err;
  });

  sfLoading.set(cacheKey, promise);
  return promise;
}

export function isSoundfontLoaded(instrumentId: string): boolean {
  const inst = getInstrument(instrumentId);
  if (!inst.sfName) return false;
  return sfCache.has(inst.sfName);
}

export function getLoadedSoundfont(instrumentId: string): SoundfontInstance | null {
  const inst = getInstrument(instrumentId);
  if (!inst.sfName) return null;
  return sfCache.get(inst.sfName) || null;
}
