/* ── MIDI Recorder — Web MIDI API ── */

export type MidiNote = {
  degree: number;
  octave: number;
  velocity: number;
  startTime: number;
  endTime: number;
  midiNote: number;
};

export type MidiCallbacks = {
  onNoteOn?: (note: MidiNote) => void;
  onNoteOff?: (note: MidiNote) => void;
  onDeviceChange?: (devices: MidiDeviceInfo[]) => void;
  onError?: (err: string) => void;
};

export type MidiDeviceInfo = {
  id: string;
  name: string;
  manufacturer: string;
  connected: boolean;
};

/* CROMUS degree from MIDI note number */
function midiToDegreeInfo(midi: number): { degree: number; octave: number; acc: number } {
  const pitchClass = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const map: Record<number, { degree: number; acc: number }> = {
    0: { degree: 1, acc: 0 },
    1: { degree: 1, acc: 1 },
    2: { degree: 2, acc: 0 },
    3: { degree: 2, acc: 1 },
    4: { degree: 3, acc: 0 },
    5: { degree: 4, acc: 0 },
    6: { degree: 4, acc: 1 },
    7: { degree: 5, acc: 0 },
    8: { degree: 5, acc: 1 },
    9: { degree: 6, acc: 0 },
    10: { degree: 6, acc: 1 },
    11: { degree: 7, acc: 0 },
  };
  return { ...map[pitchClass] || { degree: 1, acc: 0 }, octave };
}

export class MidiRecorder {
  private access: MIDIAccess | null = null;
  private callbacks: MidiCallbacks;
  private activeNotes: Map<number, MidiNote> = new Map();
  private running = false;
  recordedNotes: MidiNote[] = [];

  constructor(callbacks: MidiCallbacks = {}) {
    this.callbacks = callbacks;
  }

  async start(): Promise<boolean> {
    if (this.running) return true;

    if (!navigator.requestMIDIAccess) {
      this.callbacks.onError?.("Web MIDI API não suportada. Use Chrome ou Edge.");
      return false;
    }

    try {
      this.access = await navigator.requestMIDIAccess();
      this.access.onstatechange = this.handleStateChange;

      this.running = true;
      this.recordedNotes = [];
      this.activeNotes.clear();

      this.scanDevices();
      this.connectInputs();

      return true;
    } catch (err: any) {
      this.callbacks.onError?.(err.message || "Erro ao acessar MIDI");
      return false;
    }
  }

  stop(): MidiNote[] {
    this.running = false;

    /* Finaliza notas ainda ativas */
    const now = performance.now();
    this.activeNotes.forEach((note, _midiNote) => {
      note.endTime = now;
      this.recordedNotes.push(note);
      this.callbacks.onNoteOff?.(note);
    });
    this.activeNotes.clear();

    this.access?.inputs?.forEach((input) => {
      input.onmidimessage = null;
    });

    return [...this.recordedNotes];
  }

  isRecording(): boolean {
    return this.running;
  }

  getDevices(): MidiDeviceInfo[] {
    if (!this.access) return [];
    const devices: MidiDeviceInfo[] = [];
    this.access.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || "MIDI desconhecido",
        manufacturer: input.manufacturer || "",
        connected: input.state === "connected",
      });
    });
    return devices;
  }

  private scanDevices = (): void => {
    const devices = this.getDevices();
    this.callbacks.onDeviceChange?.(devices);
  };

  private handleStateChange = (event: MIDIConnectionEvent): void => {
    this.scanDevices();
    if (event.port?.state === "connected" && event.port?.type === "input") {
      (event.port as MIDIInput).onmidimessage = this.handleMessage;
    }
  };

  private connectInputs = (): void => {
    if (!this.access) return;
    this.access.inputs.forEach((input) => {
      input.onmidimessage = this.handleMessage;
    });
  };

  private handleMessage = (event: MIDIMessageEvent): void => {
    if (!this.running || !event.data) return;

    const [status, note, velocity] = event.data;
    const midiNote = note;
    const now = performance.now();

    /* Note On */
    if (status >= 144 && status <= 159 && velocity > 0) {
      const { degree, octave } = midiToDegreeInfo(midiNote);
      const n: MidiNote = {
        degree, octave, velocity,
        startTime: now, endTime: now, midiNote,
      };
      this.activeNotes.set(midiNote, n);
      this.callbacks.onNoteOn?.(n);
    }
    /* Note Off */
    else if ((status >= 128 && status <= 143) || velocity === 0) {
      const n = this.activeNotes.get(midiNote);
      if (n) {
        n.endTime = now;
        this.recordedNotes.push(n);
        this.callbacks.onNoteOff?.(n);
        this.activeNotes.delete(midiNote);
      }
    }
  };
}

/* ── Convert MIDI notes to CROMUS syntax ── */

export function midiNotesToCromus(notes: MidiNote[]): string {
  if (!notes.length) return "";

  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime);
  const tokens: string[] = [];

  for (const n of sorted) {
    if (n.degree < 1 || n.degree > 7) continue;

    let token = String(n.degree);

    /* Octave markers: base = 4 (middle C) */
    const baseOctave = 4;
    if (n.octave > baseOctave) {
      token += "'".repeat(n.octave - baseOctave);
    } else if (n.octave < baseOctave) {
      token = "'".repeat(baseOctave - n.octave) + token;
    }

    tokens.push(token);
  }

  /* Group into lines of 8 notes */
  const lines: string[] = [];
  for (let i = 0; i < tokens.length; i += 8) {
    lines.push(tokens.slice(i, i + 8).join(" "));
  }
  return lines.join("\n");
}
