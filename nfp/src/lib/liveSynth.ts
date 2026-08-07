/* ── Live Synth — tocar notas em tempo real (SoundFont + sintese fallback) ── */

import { type InstrumentDef, getInstrument, loadSoundfont, getLoadedSoundfont, isSoundfontLoaded } from "./instruments";

type Voice = {
  oscillators: OscillatorNode[];
  env: GainNode;
  filter?: BiquadFilterNode;
  vibrato?: { lfo: OscillatorNode; lfoGain: GainNode };
  stopFn?: () => void;
  stopTime: number;
};

export class LiveSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private activeVoices: Map<number, Voice> = new Map();
  private instrumentId: string = "piano";
  private useSoundfont: boolean = true;
  private loadingStatus: "idle" | "loading" | "ready" | "error" = "idle";
  private onStatusChange?: (status: string) => void;

  setInstrument(id: string): void {
    if (this.instrumentId === id) return;
    this.instrumentId = id;
    /* Se o SoundFont ja esta carregado, ok. Se nao, carrega. */
    if (this.useSoundfont && getInstrument(id).sfName) {
      if (isSoundfontLoaded(id)) {
        this.loadingStatus = "ready";
        this.onStatusChange?.("ready");
      } else {
        this.loadSf();
      }
    } else {
      this.loadingStatus = "ready";
      this.onStatusChange?.("ready");
    }
  }

  getInstrument(): string {
    return this.instrumentId;
  }

  getStatus(): string {
    return this.loadingStatus;
  }

  setUseSoundfont(use: boolean): void {
    this.useSoundfont = use;
    if (!use) {
      this.loadingStatus = "ready";
      this.onStatusChange?.("ready");
    } else {
      this.setInstrument(this.instrumentId);
    }
  }

  onStatus(cb: (status: string) => void): void {
    this.onStatusChange = cb;
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.4;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  private async loadSf(): Promise<void> {
    if (!getInstrument(this.instrumentId).sfName) return;
    const ctx = this.ensureCtx();
    if (!this.master) return;
    this.loadingStatus = "loading";
    this.onStatusChange?.("loading");
    try {
      await loadSoundfont(this.instrumentId, ctx, this.master);
      this.loadingStatus = "ready";
      this.onStatusChange?.("ready");
    } catch {
      this.loadingStatus = "error";
      this.onStatusChange?.("error");
    }
  }

  /* Toca uma nota por frequencia. id identifica a voz para poder parar depois. */
  noteOn(id: number, freq: number, velocity = 0.8): void {
    const ctx = this.ensureCtx();
    if (!this.master) return;

    this.noteOff(id);

    const inst = getInstrument(this.instrumentId);

    /* Tentar SoundFont primeiro */
    if (this.useSoundfont && inst.sfName) {
      const sf = getLoadedSoundfont(this.instrumentId);
      if (sf) {
        const midi = Math.round(12 * Math.log2(freq / 440) + 69);
        const stopFn = sf.start({ note: midi, velocity: Math.round(velocity * 127) });
        const voice: Voice = {
          oscillators: [],
          env: ctx.createGain(),
          stopFn,
          stopTime: ctx.currentTime + (inst.maxDuration || 30),
        };
        this.activeVoices.set(id, voice);

        if (inst.maxDuration) {
          setTimeout(() => this.noteOff(id), inst.maxDuration * 1000);
        }
        return;
      }
      /* Se nao esta carregado, tenta carregar em background e usa sintese enquanto */
      if (this.loadingStatus !== "loading") this.loadSf();
    }

    /* Fallback: sintese */
    this.synthNoteOn(id, freq, velocity, inst, ctx);
  }

  private synthNoteOn(id: number, freq: number, velocity: number, inst: InstrumentDef, ctx: AudioContext): void {
    const now = ctx.currentTime;
    const { adsr, oscillators: oscDefs, filter: filterDef, vibrato: vibDef, maxDuration } = inst;

    let filter: BiquadFilterNode | undefined;
    let outputNode: AudioNode = this.master!;
    if (filterDef) {
      filter = ctx.createBiquadFilter();
      filter.type = filterDef.type;
      filter.frequency.value = filterDef.freq;
      filter.Q.value = filterDef.Q;
      filter.connect(this.master!);
      outputNode = filter;
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(velocity, now + adsr.attack);
    env.gain.linearRampToValueAtTime(velocity * adsr.sustain, now + adsr.attack + adsr.decay);
    env.connect(outputNode);

    const oscs: OscillatorNode[] = [];
    let vibratoLfo: OscillatorNode | undefined;
    let vibratoGain: GainNode | undefined;

    if (vibDef) {
      vibratoLfo = ctx.createOscillator();
      vibratoLfo.frequency.value = vibDef.freq;
      vibratoGain = ctx.createGain();
      vibratoGain.gain.value = 0;
      vibratoLfo.connect(vibratoGain);
      vibratoLfo.start(now);
    }

    for (const def of oscDefs) {
      const osc = ctx.createOscillator();
      osc.type = def.type;
      osc.frequency.value = freq * def.freqMult;
      if (def.detune) osc.detune.value = def.detune;

      const oscGain = ctx.createGain();
      oscGain.gain.value = def.gain;

      osc.connect(oscGain);
      oscGain.connect(env);
      osc.start(now);
      oscs.push(osc);

      if (vibratoGain) vibratoGain.connect(osc.detune);
    }

    if (vibratoLfo && vibratoGain && vibDef) {
      vibratoGain.gain.setValueAtTime(0, now);
      vibratoGain.gain.linearRampToValueAtTime(vibDef.depth, now + vibDef.delay);
    }

    const stopTime = maxDuration ? now + maxDuration : now + 30;
    const voice: Voice = {
      oscillators: oscs,
      env,
      filter,
      vibrato: vibratoLfo ? { lfo: vibratoLfo, lfoGain: vibratoGain! } : undefined,
      stopTime,
    };
    this.activeVoices.set(id, voice);

    const stopMs = maxDuration ? maxDuration * 1000 : 30000;
    setTimeout(() => this.noteOff(id), stopMs);
  }

  noteOff(id: number): void {
    const voice = this.activeVoices.get(id);
    if (!voice || !this.ctx) return;

    /* SoundFont */
    if (voice.stopFn) {
      voice.stopFn();
      this.activeVoices.delete(id);
      return;
    }

    /* Sintese */
    const now = this.ctx.currentTime;
    const inst = getInstrument(this.instrumentId);
    const release = inst.adsr.release;

    voice.env.gain.cancelScheduledValues(now);
    voice.env.gain.setValueAtTime(voice.env.gain.value, now);
    voice.env.gain.linearRampToValueAtTime(0, now + release);

    for (const osc of voice.oscillators) {
      try { osc.stop(now + release + 0.05); } catch {}
    }
    if (voice.vibrato) {
      try { voice.vibrato.lfo.stop(now + release + 0.05); } catch {}
    }
    this.activeVoices.delete(id);
  }

  /* Tocar nota curta (one-shot) — step sequencer e testar */
  pluck(freq: number, duration = 0.3): void {
    const ctx = this.ensureCtx();
    if (!this.master) return;
    const now = ctx.currentTime;
    const inst = getInstrument(this.instrumentId);

    /* SoundFont */
    if (this.useSoundfont && inst.sfName) {
      const sf = getLoadedSoundfont(this.instrumentId);
      if (sf) {
        const midi = Math.round(12 * Math.log2(freq / 440) + 69);
        sf.start({ note: midi, velocity: 90, duration });
        return;
      }
      if (this.loadingStatus !== "loading") this.loadSf();
    }

    /* Fallback sintese */
    let outputNode: AudioNode = this.master;
    if (inst.filter) {
      const filter = ctx.createBiquadFilter();
      filter.type = inst.filter.type;
      filter.frequency.value = inst.filter.freq;
      filter.Q.value = inst.filter.Q;
      filter.connect(this.master);
      outputNode = filter;
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.7, now + inst.adsr.attack);
    env.gain.exponentialRampToValueAtTime(0.001, now + duration);
    env.connect(outputNode);

    for (const def of inst.oscillators) {
      const osc = ctx.createOscillator();
      osc.type = def.type;
      osc.frequency.value = freq * def.freqMult;
      if (def.detune) osc.detune.value = def.detune;
      const g = ctx.createGain();
      g.gain.value = def.gain;
      osc.connect(g);
      g.connect(env);
      osc.start(now);
      osc.stop(now + duration + 0.05);
    }
  }

  /* Pre-carregar instrumento (chamar ao selecionar) */
  async preload(): Promise<void> {
    if (!this.useSoundfont) return;
    const inst = getInstrument(this.instrumentId);
    if (!inst.sfName) return;
    if (isSoundfontLoaded(this.instrumentId)) {
      this.loadingStatus = "ready";
      this.onStatusChange?.("ready");
      return;
    }
    await this.loadSf();
  }

  dispose(): void {
    this.activeVoices.forEach((_, id) => this.noteOff(id));
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
      this.master = null;
    }
  }
}

/* Frequencias dos graus CROMUS na oitava 4 */
export const DEGREE_FREQ: Record<number, number> = {
  1: 261.63, 2: 293.66, 3: 329.63, 4: 349.23,
  5: 392.00, 6: 440.00, 7: 493.88,
};

export function degreeToFreq(degree: number, octave: number = 4): number {
  const base = DEGREE_FREQ[degree] || 261.63;
  return base * Math.pow(2, octave - 4);
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
