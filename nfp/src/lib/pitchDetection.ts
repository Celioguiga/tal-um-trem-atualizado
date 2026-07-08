/* ── Pitch Detection (autocorrelation) + Melody Recorder ── */

export type DetectedNote = {
  degree: number;
  octave: number;
  freq: number;
  startTime: number;
  endTime: number;
  cents: number;
};

/* 12-TET frequency table */
const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const A4 = 440;
const SEMITONES = 12;

function freqToPitch(freq: number): { midi: number; name: string; cents: number } {
  if (freq <= 0) return { midi: -1, name: "---", cents: 0 };
  const midiRaw = SEMITONES * (Math.log2(freq / A4)) + 69;
  const midi = Math.round(midiRaw);
  const cents = 100 * (midiRaw - Math.floor(midiRaw + 0.5));
  const octave = Math.floor(midi / SEMITONES) - 1;
  const noteIdx = midi % SEMITONES;
  return { midi, name: NOTE_NAMES[noteIdx] + octave, cents };
}

/* CROMUS degree from MIDI note (C=1, D=2, ... B=7) */
function midiToDegree(midi: number): { degree: number; octave: number; acc: number } {
  const pitchClass = ((midi % SEMITONES) + SEMITONES) % SEMITONES;
  const octave = Math.floor(midi / SEMITONES) - 1;
  /* C=0, C#=1, D=2, D#=3, E=4, F=5, F#=6, G=7, G#=8, A=9, A#=10, B=11 */
  const map: Record<number, { degree: number; acc: number }> = {
    0: { degree: 1, acc: 0 },   /* C */
    1: { degree: 1, acc: 1 },   /* C# */
    2: { degree: 2, acc: 0 },   /* D */
    3: { degree: 2, acc: 1 },   /* D# */
    4: { degree: 3, acc: 0 },   /* E */
    5: { degree: 4, acc: 0 },   /* F */
    6: { degree: 4, acc: 1 },   /* F# */
    7: { degree: 5, acc: 0 },   /* G */
    8: { degree: 5, acc: 1 },   /* G# */
    9: { degree: 6, acc: 0 },   /* A */
    10: { degree: 6, acc: 1 },  /* A# */
    11: { degree: 7, acc: 0 },  /* B */
  };
  const m = map[pitchClass] || { degree: 1, acc: 0 };
  return { degree: m.degree, octave, acc: m.acc };
}

/* McLeod Pitch Method — autocorrelation-based pitch detection */
function mcleodPitch(buffer: Float32Array, sampleRate: number): number {
  const len = buffer.length;
  if (len < 2) return -1;

  /* ASDF: Average Squared Difference Function */
  const maxLag = Math.floor(len / 2);
  const minLag = Math.floor(sampleRate / 2000); /* ~2kHz max */
  const asdf = new Float32Array(maxLag);

  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < maxLag; i++) {
      const diff = buffer[i] - buffer[i + lag];
      sum += diff * diff;
    }
    asdf[lag] = sum;
  }

  /* Find first valley below threshold */
  const threshold = 0.9;
  let firstMin = -1;
  let firstMinVal = Infinity;

  for (let lag = minLag; lag < maxLag; lag++) {
    if (asdf[lag] < firstMinVal) {
      firstMinVal = asdf[lag];
      firstMin = lag;
    }
    /* If we found a minimum and it starts rising past threshold */
    if (firstMin > 0 && asdf[lag] > firstMinVal * (1 + (1 - threshold))) {
      break;
    }
  }

  if (firstMin <= 0) return -1;

  /* Parabolic interpolation for better accuracy */
  if (firstMin > 0 && firstMin < maxLag - 1) {
    const a = asdf[firstMin - 1];
    const b = asdf[firstMin];
    const c = asdf[firstMin + 1];
    const delta = (a - c) / (2 * (a - 2 * b + c));
    const refinedLag = firstMin + (delta || 0);
    return sampleRate / refinedLag;
  }

  return sampleRate / firstMin;
}

/* ── Recorder ── */

export type RecorderCallbacks = {
  onNoteOn?: (note: DetectedNote) => void;
  onNoteOff?: (note: DetectedNote) => void;
  onPitch?: (freq: number, degree: number, name: string) => void;
  onError?: (err: string) => void;
};

export class MelodyRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private running = false;
  private rafId = 0;
  private callbacks: RecorderCallbacks;
  private sampleRate = 48000;
  private bufferSize = 2048;
  private audioBuffer: Float32Array = new Float32Array(0);
  private currentNote: DetectedNote | null = null;
  private stableFreq = 0;
  private stableCount = 0;
  private lastFreq = 0;
  /* Silêncio: sem pitch consistente por este tempo (ms) */
  private static SILENCE_TIMEOUT = 180;
  /* Estabilidade: mesma frequência por este número de frames */
  private static STABILITY_FRAMES = 4;
  /* Mudança de nota: diferença em cents para considerar nota nova */
  private static NOTE_CHANGE_CENTS = 30;

  recordedNotes: DetectedNote[] = [];

  constructor(callbacks: RecorderCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async start(): Promise<void> {
    if (this.running) return;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      this.ctx = new AudioContext();
      this.sampleRate = this.ctx.sampleRate;
      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = this.bufferSize * 2;
      this.source.connect(this.analyser);

      this.running = true;
      this.recordedNotes = [];
      this.currentNote = null;
      this.stableFreq = 0;
      this.stableCount = 0;
      this.lastFreq = 0;
      this.bufferSize = this.analyser.fftSize;
      this.audioBuffer = new Float32Array(this.bufferSize);

      this.detectLoop();
    } catch (err: any) {
      this.callbacks.onError?.(err.message || "Erro ao acessar microfone");
      throw err;
    }
  }

  stop(): DetectedNote[] {
    this.running = false;
    cancelAnimationFrame(this.rafId);

    /* Finaliza nota atual */
    if (this.currentNote) {
      this.currentNote.endTime = Date.now();
      this.callbacks.onNoteOff?.(this.currentNote);
    }

    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
    this.source = null;
    this.stream = null;
    this.ctx = null;
    this.analyser = null;

    return [...this.recordedNotes];
  }

  isRecording(): boolean {
    return this.running;
  }

  private detectLoop = (): void => {
    if (!this.running || !this.analyser) return;

    this.analyser.getFloatTimeDomainData(this.audioBuffer);
    const freq = mcleodPitch(this.audioBuffer, this.sampleRate);
    const now = Date.now();

    if (freq > 80 && freq < 2000) {
      const { midi, name } = freqToPitch(freq);
      const { degree, octave } = midiToDegree(midi);

      this.callbacks.onPitch?.(freq, degree, name);

      /* Check stability */
      if (Math.abs(freq - this.lastFreq) / this.lastFreq < 0.03) {
        this.stableCount++;
      } else {
        this.stableCount = 0;
        this.stableFreq = 0;
      }

      if (this.stableCount >= MelodyRecorder.STABILITY_FRAMES) {
        this.stableFreq = freq;
      }

      /* Note change detection */
      if (this.currentNote) {
        const centsDelta = Math.abs(1200 * Math.log2(freq / this.currentNote.freq));
        if (centsDelta > MelodyRecorder.NOTE_CHANGE_CENTS) {
          /* Note changed — end current, start new */
          this.currentNote.endTime = now;
          this.callbacks.onNoteOff?.(this.currentNote);
          this.recordedNotes.push(this.currentNote);

          this.currentNote = {
            degree, octave, freq: this.stableFreq || freq,
            startTime: now, endTime: now, cents: 0,
          };
          this.callbacks.onNoteOn?.(this.currentNote);
        }
      } else if (this.stableFreq > 0) {
        /* Start first note */
        this.currentNote = {
          degree, octave, freq: this.stableFreq,
          startTime: now, endTime: now, cents: 0,
        };
        this.callbacks.onNoteOn?.(this.currentNote);
      }

      this.lastFreq = freq;
    } else {
      /* Silence detected */
      if (this.currentNote && now - this.currentNote.endTime > MelodyRecorder.SILENCE_TIMEOUT) {
        this.currentNote.endTime = now;
        this.callbacks.onNoteOff?.(this.currentNote);
        this.recordedNotes.push(this.currentNote);
        this.currentNote = null;
      }
      this.stableCount = 0;
      this.stableFreq = 0;
    }

    this.rafId = requestAnimationFrame(this.detectLoop);
  };
}

/* ── Convert to CROMUS ── */

export function notesToCromus(notes: DetectedNote[]): string {
  if (!notes.length) return "";

  let tokens: string[] = [];
  for (const n of notes) {
    if (n.degree < 1 || n.degree > 7) continue;

    let token = String(n.degree);

    /* Octave markers */
    const baseOctave = 4;
    if (n.octave > baseOctave) {
      token += "'".repeat(n.octave - baseOctave);
    } else if (n.octave < baseOctave) {
      token = "'".repeat(baseOctave - n.octave) + token;
    }

    /* Duration — approximate based on time between notes */
    const dur = n.endTime - n.startTime;
    if (dur > 0) {
      if (dur < 300) {
        /* short note — just the degree, no extra markers */
      }
    }

    tokens.push(token);
  }

  /* Group into lines of 8 notes (2 bars of 4/4) */
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i += 8) {
    lines.push(tokens.slice(i, i + 8).join(" "));
  }

  return lines.join("\n");
}

/* ── MIDI-like frequency to degree helper ── */
export function freqToDegree(freq: number): number {
  if (freq <= 0) return 0;
  const midi = Math.round(SEMITONES * (Math.log2(freq / A4)) + 69);
  return midiToDegree(midi).degree;
}
