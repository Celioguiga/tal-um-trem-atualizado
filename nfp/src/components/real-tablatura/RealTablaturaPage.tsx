import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../lib/theme";

/* ═══════════════════════════════════════════
   CENTRAL DATA MODEL
   ═══════════════════════════════════════════ */
type NoteEvent = {
  id: string;
  step: number;      // 0-15 grid position
  degree: number;    // 1-7
  octave: number;    // 0=middle, 1=up, -1=down
  accidental: "" | "#" | "b";
};

/* ═══════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════ */
const CORES: Record<number, string> = {
  1: "#C0001A", 2: "#ECD200", 3: "#F07300",
  4: "#00B050", 5: "#0066FF", 6: "#8B5E00", 7: "#9B5FC0",
};
const FORMAS: Record<number, string> = {
  1: "●", 2: "◆", 3: "▲", 4: "■", 5: "★", 6: "⬡", 7: "🏠",
};
const BASE_FREQ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
const STEPS = 16;
const STAFF_LINES = 5;
const LINE_GAP = 20;
const STAFF_TOP = 40;
const STAFF_BOT = STAFF_TOP + (STAFF_LINES - 1) * LINE_GAP;
const STEP_W = 36;

/* ── Staff Y → degree/octave ── */
// lineIdx 0=top(F5) → 12=bottom(C4), from click handler
const Y_MAP: { degree: number; octave: number }[] = [
  { degree: 4, octave: 1 }, // 0:  F5 (top line)
  { degree: 3, octave: 1 }, // 1:  E5
  { degree: 2, octave: 1 }, // 2:  D5
  { degree: 1, octave: 1 }, // 3:  C5
  { degree: 7, octave: 0 }, // 4:  B4
  { degree: 6, octave: 0 }, // 5:  A4
  { degree: 5, octave: 0 }, // 6:  G4
  { degree: 4, octave: 0 }, // 7:  F4
  { degree: 3, octave: 0 }, // 8:  E4 (bottom line)
  { degree: 2, octave: 0 }, // 9:  D4 (ledger)
  { degree: 1, octave: 0 }, // 10: C4 (ledger)
  { degree: 7, octave: -1 }, // 11: B3
  { degree: 6, octave: -1 }, // 12: A3
];

const SCALES: Record<string, number[]> = {
  "Maior": [1, 2, 3, 4, 5, 6, 7],
  "Menor Natural": [1, 2, 3, 4, 5, 6, 7],
  "Pentatônica Maior": [1, 2, 3, 5, 6],
  "Pentatônica Menor": [1, 3, 4, 5, 7],
  "Dórica": [1, 2, 3, 4, 5, 6, 7],
  "Frígia": [1, 2, 3, 4, 5, 6, 7],
  "Lídia": [1, 2, 3, 4, 5, 6, 7],
  "Mixolídia": [1, 2, 3, 4, 5, 6, 7],
  "Bizantina": [1, 2, 3, 4, 5, 6, 7],
  "Blues": [1, 3, 4, 5, 6, 7],
  "Diminuta": [1, 3, 5, 7],
  "Whole Tone": [1, 2, 3, 4, 5, 6],
};

/* ── LCG ── */
function lcg(seed: number): () => number {
  let s = seed;
  return () => { s = (1664525 * s + 1013904223) & 0xffffffff; return (s >>> 0) / 0x100000000; };
}

/* ═══════════════════════════════════════════
   CANVAS STAFF
   ═══════════════════════════════════════════ */
function drawStaff(ctx: CanvasRenderingContext2D, w: number, h: number,
  notes: NoteEvent[], themeVars: Record<string, string>,
  _onNoteToggle: (step: number, degree: number, octave: number) => void,
  currentStep = -1,
) {
  const bg = themeVars["--bg"] || "#0f0f0f";
  const fg = themeVars["--text"] || "#ccc";
  const dim = themeVars["--textDim"] || "#666";
  const accent = themeVars["--accent"] || "#008DDA";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Step playhead highlight
  if (currentStep >= 0 && currentStep < STEPS) {
    ctx.fillStyle = accent + "15";
    ctx.fillRect(40 + currentStep * STEP_W, STAFF_TOP, STEP_W, STAFF_BOT - STAFF_TOP);
  }

  // Staff lines
  ctx.strokeStyle = dim;
  ctx.lineWidth = 1;
  for (let i = 0; i < STAFF_LINES; i++) {
    const y = STAFF_TOP + i * LINE_GAP;
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Step grid lines
  ctx.strokeStyle = dim + "30";
  ctx.lineWidth = 0.5;
  for (let s = 0; s <= STEPS; s++) {
    const x = 40 + s * STEP_W;
    ctx.beginPath();
    ctx.moveTo(x, STAFF_TOP);
    ctx.lineTo(x, STAFF_BOT);
    ctx.stroke();
  }

  // Step numbers
  ctx.fillStyle = dim;
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  for (let s = 0; s < STEPS; s++) {
    ctx.fillText(String(s + 1), 40 + s * STEP_W + STEP_W / 2, STAFF_TOP - 6);
  }

  // Treble clef
  ctx.fillStyle = fg;
  ctx.font = "36px serif";
  ctx.textAlign = "left";
  ctx.fillText("\uD834\uDD1E", 4, STAFF_BOT - 4);

  // Notes
  for (const n of notes) {
    const yi = yIndex(n.degree, n.octave);
    if (yi < 0 || yi > 12) continue;
    const cy = STAFF_BOT - (yi * LINE_GAP) / 2;
    const cx = 40 + n.step * STEP_W + STEP_W / 2;
    const color = CORES[n.degree] || "#888";

    // Ledger lines
    if (yi >= 10) {
      ctx.strokeStyle = dim;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 8, STAFF_BOT + (yi - 4) * LINE_GAP / 2);
      ctx.lineTo(cx + 8, STAFF_BOT + (yi - 4) * LINE_GAP / 2);
      ctx.stroke();
    }

    // Note head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6, 4.5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

const Y_DEG_LOOKUP: Record<string, number> = {};
for (let i = 0; i < Y_MAP.length; i++) {
  Y_DEG_LOOKUP[`${Y_MAP[i].degree}-${Y_MAP[i].octave}`] = i;
}
function yIndex(degree: number, octave: number): number {
  return Y_DEG_LOOKUP[`${degree}-${octave}`] ?? 8;
}

/* ═══════════════════════════════════════════
   CROMUS GEOMETRIC PANEL
   ═══════════════════════════════════════════ */
const GRAUS = [1, 2, 3, 4, 5, 6, 7];
const NOME_GRAU: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI", 7: "VII",
};

function CromusPanel({
  notes, onToggle, vars, currentStep,
}: {
  notes: NoteEvent[];
  onToggle: (step: number, degree: number) => void;
  vars: Record<string, string>;
  currentStep: number;
}) {
  const active = new Set(notes.map((n) => `${n.step}-${n.degree}`));

  return (
    <div className="flex-1 overflow-auto p-2 text-[11px]" style={{ background: vars["--bg"] }}>
      <div className="grid" style={{ gridTemplateColumns: `28px repeat(${STEPS}, 1fr)`, gap: 1 }}>
        <div />
        {Array.from({ length: STEPS }, (_, s) => (
          <div key={s}
            className="text-center font-mono rounded"
            style={{
              color: s === currentStep ? "#fff" : vars["--textDim"],
              background: s === currentStep ? vars["--accent"] : "transparent",
            }}
          >
            {s + 1}
          </div>
        ))}

        {GRAUS.map((g) => (
          <>
            <div className="flex items-center justify-center font-bold text-[10px]" style={{ color: CORES[g] }}>
              {NOME_GRAU[g]}
            </div>
            {Array.from({ length: STEPS }, (_, s) => {
              const isOn = active.has(`${s}-${g}`);
              return (
                <button
                  key={s}
                  onClick={() => onToggle(s, g)}
                  className="flex items-center justify-center aspect-square rounded text-xs transition-all cursor-pointer"
                  style={{
                    background: isOn ? CORES[g] + "25" : s === currentStep ? vars["--accent"] + "15" : "transparent",
                    color: isOn ? CORES[g] : vars["--textMuted"],
                    border: `1px solid ${s === currentStep ? vars["--accent"] : isOn ? CORES[g] + "50" : vars["--border"]}`,
                    opacity: isOn ? 1 : s === currentStep ? 0.7 : 0.4,
                    fontSize: isOn ? "14px" : "10px",
                  }}
                >
                  {isOn ? FORMAS[g] : s === currentStep ? "▸" : "·"}
                </button>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONVERSÃO: NoteEvent[] ↔ CROMUS syntax
   ═══════════════════════════════════════════ */
function notesToSyntax(notes: NoteEvent[]): string {
  if (notes.length === 0) return "";
  const sorted = [...notes].sort((a, b) => a.step - b.step);
  const parts: string[] = [];
  for (let s = 0; s < STEPS; s++) {
    const ns = sorted.filter((n) => n.step === s);
    if (ns.length === 0) {
      parts.push("-");
    } else if (ns.length === 1) {
      const n = ns[0];
      const oct = n.octave > 0 ? "'" : n.octave < 0 ? "," : "";
      const acc = n.accidental;
      parts.push(`${oct}${n.degree}${acc}${oct}`);
    } else {
      // chord: group
      const chord = ns.map((n) => {
        const oct = n.octave > 0 ? "'" : n.octave < 0 ? "," : "";
        return `<${oct}${n.degree}>`;
      }).join("");
      parts.push(chord);
    }
  }
  return parts.join(" ");
}

function syntaxToNotes(s: string): NoteEvent[] {
  const notes: NoteEvent[] = [];
  const tokens = s.trim().split(/\s+/);
  for (let step = 0; step < Math.min(tokens.length, STEPS); step++) {
    const tok = tokens[step];
    if (!tok || tok === "-" || tok === "|") continue;

    // Parse chord <1 3 5> or single note
    const singleMatch = tok.match(/^('*)(\d+)([#b]?)('*)$/);
    if (singleMatch) {
      const octUp = singleMatch[1].length;
      const octDown = singleMatch[4].length;
      const degree = parseInt(singleMatch[2], 10);
      const acc = (singleMatch[3] || "") as "" | "#" | "b";
      if (degree >= 1 && degree <= 7) {
        notes.push({
          id: `${step}-${degree}-${Date.now()}`,
          step,
          degree,
          octave: octUp - octDown,
          accidental: acc,
        });
      }
    }
  }
  return notes;
}

/* ═══════════════════════════════════════════
   MUSICXML
   ═══════════════════════════════════════════ */
function notesToMusicXML(notes: NoteEvent[], title: string): string {
  const pitchMap = ["C", "D", "E", "F", "G", "A", "B"];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>${title}</part-name></score-part></part-list>
  <part id="P1">\n`;
  let curStep = 0;
  for (const n of notes.sort((a, b) => a.step - b.step)) {
    const div = n.step - curStep;
    if (div > 0) {
      xml += `    <measure number="${curStep + 1}"><attributes><divisions>1</divisions></attributes><note><rest/><duration>${div}</duration></note></measure>\n`;
    }
    const step = pitchMap[n.degree - 1];
    const oct = 4 + n.octave;
    xml += `    <measure number="${n.step + 1}">
      <note><pitch><step>${step}</step><octave>${oct}</octave></pitch><duration>1</duration></note>
    </measure>\n`;
    curStep = n.step + 1;
  }
  xml += `  </part>\n</score-partwise>`;
  return xml;
}

/* ═══════════════════════════════════════════
   AUDIO ENGINE
   ═══════════════════════════════════════════ */
function scheduleNote(
  ctx: AudioContext, dest: GainNode, freq: number, t: number, dur: number,
) {
  const osc1 = ctx.createOscillator();
  osc1.type = "sine";
  osc1.frequency.value = freq;
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.value = freq * 2;
  osc2.detune.value = 3;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 5.5;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 3;
  lfo.connect(lfoG);
  lfoG.connect(osc1.frequency);
  lfoG.connect(osc2.frequency);
  lfo.start(t);
  lfo.stop(t + dur);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(1, t + 0.015);
  env.gain.linearRampToValueAtTime(0.6, t + 0.065);
  env.gain.setValueAtTime(0.6, t + dur * 0.7);
  env.gain.linearRampToValueAtTime(0, t + dur);
  const pan = ctx.createStereoPanner();
  pan.pan.value = (Math.random() - 0.5) * 0.3;
  const osc2Gain = ctx.createGain();
  osc2Gain.gain.value = 0.35;
  osc1.connect(env);
  osc2.connect(osc2Gain);
  osc2Gain.connect(env);
  env.connect(pan);
  pan.connect(dest);
  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + dur);
  osc2.stop(t + dur);
}

function createReverb(ctx: AudioContext): GainNode {
  const dry = ctx.createGain();
  dry.gain.value = 0.7;
  const wet = ctx.createGain();
  wet.gain.value = 0.2;
  const del = ctx.createDelay(0.5);
  del.delayTime.value = 0.12;
  const fb = ctx.createGain();
  fb.gain.value = 0.3;
  del.connect(fb);
  fb.connect(del);
  fb.connect(wet);
  wet.connect(ctx.destination);
  return dry;
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export function RealTablaturaPage() {
  const { vars } = useTheme();
  const [notes, setNotes] = useState<NoteEvent[]>([]);
  const [sintaxe, setSintaxe] = useState("");
  const [bpm, setBpm] = useState(120);
  const [seed, setSeed] = useState("0x44BC229");
  const [scale, setScale] = useState("Maior");
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<{ ctx: AudioContext } | null>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastStepRef = useRef(-1);

  /* ── Sync syntax ↔ notes ── */
  const notesToSyntaxMemo = useCallback(() => {
    const syn = notesToSyntax(notes);
    setSintaxe(syn);
  }, [notes]);

  useEffect(() => { notesToSyntaxMemo(); }, [notes, notesToSyntaxMemo]);

  const handleSyntaxChange = useCallback((val: string) => {
    setSintaxe(val);
    setNotes(syntaxToNotes(val));
  }, []);

  /* ── Canvas staff ── */
  const toggleNote = useCallback((step: number, degree: number, octave: number) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.step === step && n.degree === degree);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, { id: `${step}-${degree}-${Date.now()}`, step, degree, octave, accidental: "" }];
    });
  }, []);

  const toggleCromus = useCallback((step: number, degree: number) => {
    setNotes((prev) => {
      const idx = prev.findIndex((n) => n.step === step && n.degree === degree);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      // Default octave: degree 1(C)=C4, 2(D)=D4, 3(E)=E4, 4(F)=F4,
      // 5(G)=G4, 6(A)=A4, 7(B)=B4
      return [...prev, { id: `${step}-${degree}-${Date.now()}`, step, degree, octave: 0, accidental: "" }];
    });
  }, []);

  /* ── Redraw canvas ── */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;
    const rect = cvs.parentElement?.getBoundingClientRect();
    if (rect) {
      cvs.width = rect.width;
      cvs.height = Math.max(200, STAFF_BOT + 20);
    }
    drawStaff(ctx, cvs.width, cvs.height, notes, vars, toggleNote, currentStep);
  });

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const step = Math.round((mx - 40) / STEP_W - 0.5);
    if (step < 0 || step >= STEPS) return;
    // Map y to nearest staff position
    const sfY = (my - STAFF_TOP) / LINE_GAP;
    const lineIdx = Math.round(sfY * 2);
    if (lineIdx < 0 || lineIdx > 12) return;
    const info = Y_MAP[lineIdx] || Y_MAP[8];
    if (!info) return;
    toggleNote(step, info.degree, info.octave);
  }, [toggleNote]);

  /* ── Algorithmic generator ── */
  const handleGenerate = useCallback(() => {
    let seedVal = parseInt(seed, 16);
    if (isNaN(seedVal)) seedVal = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const rng = lcg(seedVal);
    const scaleDegs = SCALES[scale] || SCALES["Maior"];
    const generated: NoteEvent[] = [];
    for (let s = 0; s < STEPS; s++) {
      if (rng() > 0.5) {
        const deg = scaleDegs[Math.floor(rng() * scaleDegs.length)];
        const oct = s < 8 ? 0 : 0;
        generated.push({ id: `${s}-${deg}-g`, step: s, degree: deg, octave: oct, accidental: "" });
      }
    }
    setNotes(generated);
  }, [seed, scale]);

  /* ── Audio playback ── */
  const beatDur = 60 / bpm;

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) {
      try { audioRef.current.ctx.close(); } catch {}
      audioRef.current = null;
    }
    lastStepRef.current = -1;
    setPlaying(false);
    setPaused(false);
    setCurrentStep(-1);
  }, []);

  const syncLoop = useCallback(() => {
    const ctx = audioRef.current?.ctx;
    if (!ctx || ctx.state === "closed") return;
    const elapsed = ctx.currentTime - startTimeRef.current;
    const step = Math.min(Math.floor(elapsed / beatDur), STEPS - 1);
    if (step !== lastStepRef.current) {
      lastStepRef.current = step;
      setCurrentStep(step);
    }
    if (step < STEPS - 1) {
      rafRef.current = requestAnimationFrame(syncLoop);
    } else {
      stopAudio();
    }
  }, [beatDur, stopAudio]);

  const playNotes = useCallback(() => {
    stopAudio();
    if (notes.length === 0) return;
    const ctx = new AudioContext();
    const dry = createReverb(ctx);
    dry.connect(ctx.destination);
    const now = ctx.currentTime;
    const grouped = new Map<number, NoteEvent[]>();
    for (const n of notes) {
      if (!grouped.has(n.step)) grouped.set(n.step, []);
      grouped.get(n.step)!.push(n);
    }
    for (let s = 0; s < STEPS; s++) {
      const ns = grouped.get(s);
      if (!ns) continue;
      for (const n of ns) {
        const freq = BASE_FREQ[n.degree - 1] * 2 ** n.octave;
        scheduleNote(ctx, dry, freq, now + s * beatDur, beatDur);
      }
    }
    startTimeRef.current = ctx.currentTime;
    lastStepRef.current = -1;
    audioRef.current = { ctx };
    setPlaying(true);
    setPaused(false);
    setCurrentStep(0);
    rafRef.current = requestAnimationFrame(syncLoop);
  }, [notes, beatDur, syncLoop, stopAudio]);

  /* ── XML ── */
  const [xmlOutput, setXmlOutput] = useState("");
  const handleExportXML = useCallback(() => {
    setXmlOutput(notesToMusicXML(notes, "Composição RNFG"));
  }, [notes]);

  const handleCopyXML = useCallback(() => {
    if (xmlOutput) navigator.clipboard.writeText(xmlOutput);
  }, [xmlOutput]);

  /* ── Render result ── */
  const [result, setResult] = useState<{ ok: boolean; pages?: string[]; log?: string } | null>(null);
  const [rendering, setRendering] = useState(false);

  const handleRender = useCallback(async () => {
    if (!sintaxe.trim()) return;
    setRendering(true);
    setResult(null);
    try {
      const res = await fetch("/api/nfp/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, modo: "REAL", titulo: "Visual Editor", compasso: "4/4" }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, log: "Erro de conexão." });
    }
    setRendering(false);
  }, [sintaxe]);

  return (
    <div className="h-full flex flex-col" style={{ color: vars["--text"] }}>
      {/* ── Toolbar ── */}
      <div
        className="flex items-center gap-2 px-3 py-1.5 shrink-0 flex-wrap text-xs"
        style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
      >
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded"
          style={{ background: vars["--bg"], border: `1px solid ${vars["--border"]}` }}
        >
          <button
            onClick={playNotes}
            disabled={playing && !paused}
            className="px-3 py-1 text-sm font-bold rounded transition-all"
            title="Tocar"
            style={{
              background: playing && !paused ? vars["--accent"] : vars["--surface2"],
              color: playing && !paused ? "#fff" : vars["--accent"],
              opacity: playing && !paused ? 0.6 : 1,
            }}
          >▶</button>
          <button
            onClick={() => {
              if (!audioRef.current) return;
              if (paused) { audioRef.current.ctx.resume(); setPaused(false); }
              else { audioRef.current.ctx.suspend(); setPaused(true); }
            }}
            disabled={!playing}
            className="px-3 py-1 text-sm font-bold rounded transition-all"
            title={paused ? "Continuar" : "Pausar"}
            style={{
              background: paused ? vars["--accent"] : vars["--surface2"],
              color: paused ? "#fff" : vars["--textDim"],
              opacity: !playing ? 0.3 : 1,
            }}
          >{paused ? "▶" : "⏸"}</button>
          <button
            onClick={stopAudio}
            disabled={!playing}
            className="px-3 py-1 text-sm font-bold rounded transition-all"
            title="Parar"
            style={{
              background: vars["--surface2"],
              color: "#C0001A",
              opacity: !playing ? 0.3 : 1,
            }}
          >■</button>
        </div>

        <div className="w-px h-5" style={{ background: vars["--border"] }} />

        <label style={{ color: vars["--textDim"] }}>BPM</label>
        <input
          type="number" min={40} max={240} value={bpm}
          onChange={(e) => setBpm(Math.max(40, Math.min(240, +e.target.value)))}
          className="w-14 px-1 py-0.5 rounded font-mono text-xs border"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        />

        <div className="w-px h-4 mx-1" style={{ background: vars["--border"] }} />

        <label style={{ color: vars["--textDim"] }}>Seed</label>
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className="w-24 px-1 py-0.5 rounded font-mono text-xs border"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        />

        <select
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          className="px-1 py-0.5 rounded text-xs border"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        >
          {Object.keys(SCALES).map((s) => <option key={s}>{s}</option>)}
        </select>

        <button onClick={handleGenerate}
          className="px-2 py-1 rounded font-semibold"
          style={{ background: vars["--accent"], color: "#fff" }}
        >🎲 Gerar</button>

        <button onClick={() => setNotes([])}
          className="px-2 py-1 rounded text-xs"
          style={{ background: vars["--surface2"], color: vars["--textDim"] }}
        >✕ Limpar</button>

        <div className="w-px h-4 mx-1" style={{ background: vars["--border"] }} />

        <button onClick={() => {
          const key = prompt("Nome do padrão:");
          if (key) localStorage.setItem(`rt_pattern_${key}`, JSON.stringify(notes));
        }} className="px-2 py-1 rounded text-xs"
          style={{ background: vars["--surface2"], color: vars["--textDim"] }}
        >💾 Salvar</button>

        <button onClick={() => {
          const key = prompt("Nome do padrão:");
          if (!key) return;
          const raw = localStorage.getItem(`rt_pattern_${key}`);
          if (raw) setNotes(JSON.parse(raw));
        }} className="px-2 py-1 rounded text-xs"
          style={{ background: vars["--surface2"], color: vars["--textDim"] }}
        >📂 Carregar</button>

        <div className="flex-1" />

        <button
          onClick={handleRender}
          disabled={rendering || !sintaxe.trim()}
          className="px-3 py-1 rounded font-semibold disabled:opacity-40"
          style={{ background: vars["--accent"], color: "#fff" }}
        >
          {rendering ? "…" : "Renderizar"}
        </button>
      </div>

      {/* ── Main workspace ── */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Staff */}
        <div className="flex flex-col w-1/2 min-w-0" style={{ borderRight: `1px solid ${vars["--border"]}` }}>
          <div className="flex-1 overflow-auto">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full cursor-crosshair"
              style={{ display: "block" }}
            />
          </div>
          {/* Syntax editor */}
          <div
            className="shrink-0 px-2 py-1"
            style={{ background: vars["--surface"], borderTop: `1px solid ${vars["--border"]}` }}
          >
            <textarea
              value={sintaxe}
              onChange={(e) => handleSyntaxChange(e.target.value)}
              className="w-full text-xs font-mono resize-none border-0 focus:outline-none"
              rows={2}
              style={{ background: vars["--surface"], color: vars["--text"] }}
              placeholder="Sintaxe CROMUS..."
            />
          </div>

          {/* XML output */}
          <div
            className="shrink-0 px-2 py-1 flex items-center gap-2 text-[10px]"
            style={{ background: vars["--surface2"], borderTop: `1px solid ${vars["--border"]}` }}
          >
            <button
              onClick={handleExportXML}
              className="px-2 py-0.5 rounded"
              style={{ background: vars["--accent"], color: "#fff" }}
            >⬇ MusicXML</button>
            <button
              onClick={handleCopyXML}
              disabled={!xmlOutput}
              className="px-2 py-0.5 rounded disabled:opacity-30"
              style={{ background: vars["--surface"], color: vars["--textDim"] }}
            >Copiar XML</button>
            {xmlOutput && (
              <span style={{ color: vars["--textMuted"] }}>
                {xmlOutput.length > 100 ? xmlOutput.slice(0, 100) + "…" : xmlOutput}
              </span>
            )}
          </div>
        </div>

        {/* Right: CROMUS Panel + Preview */}
        <div className="flex flex-col w-1/2 min-w-0">
          <CromusPanel notes={notes} onToggle={toggleCromus} vars={vars} currentStep={currentStep} />

          {/* Preview */}
          {result?.ok && result.pages?.[0] && (
            <div
              className="shrink-0 overflow-auto flex justify-center p-2"
              style={{ borderTop: `1px solid ${vars["--border"]}`, background: vars["--bg"] }}
            >
              <img
                src={`data:image/png;base64,${result.pages[0]}`}
                alt="Preview"
                className="max-w-full max-h-48 shadow"
                style={{ border: "1px solid #333" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
