import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { RecorderPanel } from "./RecorderPanel";
import { VoiceDictationPanel } from "./VoiceDictationPanel";

const DEFAULT_SYNTAXE = `1 2 3 4 5 6 7
7 6 5 4 3 2 1
1' 2' 3' 4' 5' 6' 7'`;

const EXEMPLOS_FREE: Record<string, string> = {
  "Escala (1 oitava)": `1 2 3 4 5 6 7\n7 6 5 4 3 2 1`,
  "Dona Aranha (trecho)": `1 2 2 3\n4 4 4 4\n3 1 3 4\n1 1 1 -\n6 6 6 6\n5 4 2 1\n6 6 6 6\n5 4 2 1`,
};

const EXEMPLOS_PRO: Record<string, string> = {
  ...EXEMPLOS_FREE,
  "Peixe Vivo (trecho)": `5 3 5 3\n5 4 3 2\n1 2 3 4\n5 5 5 -\n5 3 5 3\n5 4 3 2\n1 3 5 3\n1 1 1 -`,
  "O Pião": `1 2 3 4\n5 6 7 1'\n7 6 5 4\n3 2 1 -`,
  "Caranguejo (trecho)": `5 5 5 5\n5 4 3 4\n5 5 5 5\n5 4 3 2`,
  "Tercinas": `7** 6* 5** 6* 7 6 5`,
  "Acordes": `1 3 5\n2 4 6\n3 5 7`,
  "Com Ritornello": `||: 1 2 3 4 | 5 6 7 1' :||\n(CASA1) 7 6 5 4\n(CASA2) 1 2 3 1\nFIM`,
};

const FREE_MAX_COMPASSOS = 10;

function contarCompassos(sintaxe: string): number {
  const pipes = (sintaxe.match(/\|/g) || []).length;
  if (pipes > 0) return pipes;
  const virgulas = (sintaxe.match(/,/g) || []).length;
  if (virgulas > 0) return Math.ceil(virgulas / 4);
  return Math.ceil((sintaxe.match(/\S+/g) || []).length / 8);
}

type NotePos = { x: number; y: number };
type PagePos = { notas: NotePos[]; w: number; h: number };

type RenderResult = {
  ok: boolean;
  pages?: string[];
  positions?: PagePos[];
  log?: string;
  ly?: string;
};

const TONALIDADES = [
  { label: "Dó maior", value: "c \\major" },
  { label: "Sol maior (1♯)", value: "g \\major" },
  { label: "Ré maior (2♯)", value: "d \\major" },
  { label: "Lá maior (3♯)", value: "a \\major" },
  { label: "Mi maior (4♯)", value: "e \\major" },
  { label: "Si maior (5♯)", value: "b \\major" },
  { label: "Fá♯ maior (6♯)", value: "fis \\major" },
  { label: "Dó♯ maior (7♯)", value: "cis \\major" },
  { label: "Fá maior (1♭)", value: "f \\major" },
  { label: "Si♭ maior (2♭)", value: "bes \\major" },
  { label: "Mi♭ maior (3♭)", value: "ees \\major" },
  { label: "Lá♭ maior (4♭)", value: "aes \\major" },
  { label: "Ré♭ maior (5♭)", value: "des \\major" },
  { label: "Sol♭ maior (6♭)", value: "ges \\major" },
  { label: "Dó♭ maior (7♭)", value: "ces \\major" },
  { label: "Lá menor", value: "a \\minor" },
  { label: "Mi menor (1♯)", value: "e \\minor" },
  { label: "Si menor (2♯)", value: "b \\minor" },
  { label: "Fá♯ menor (3♯)", value: "fis \\minor" },
  { label: "Dó♯ menor (4♯)", value: "cis \\minor" },
  { label: "Sol♯ menor (5♯)", value: "gis \\minor" },
  { label: "Ré♯ menor (6♯)", value: "dis \\minor" },
  { label: "Lá♯ menor (7♯)", value: "ais \\minor" },
  { label: "Ré menor (1♭)", value: "d \\minor" },
  { label: "Sol menor (2♭)", value: "g \\minor" },
  { label: "Dó menor (3♭)", value: "c \\minor" },
  { label: "Fá menor (4♭)", value: "f \\minor" },
  { label: "Si♭ menor (5♭)", value: "bes \\minor" },
  { label: "Mi♭ menor (6♭)", value: "ees \\minor" },
  { label: "Lá♭ menor (7♭)", value: "aes \\minor" },
];

function parseVoices(s: string): string[] {
  if (!s.includes("---")) return [];
  const voices: string[] = [];
  for (const line of s.split("\n")) {
    const m = line.match(/^---\s*(.+?)(?::|$)/);
    if (m) voices.push(m[1].trim());
  }
  return voices;
}

const VOICE_EMOJI: Record<string, string> = {
  "Violino I": "🎻", "Violino II": "🎻", "Viola": "🎻", "Violoncelo": "🎻", "Cello": "🎻",
  "Flauta": "🪈", "Flautim": "🪈", "Oboé": "🪈", "Clarinete": "🪈", "Fagote": "🪈",
  "Trompa": "📯", "Trompete": "🎺", "Trombone": "🎺", "Tuba": "🎺",
  "Piano": "🎹", "Harpa": "🪕", "Bateria": "🥁",
  "Soprano": "🎤", "Contralto": "🎤", "Tenor": "🎤", "Baixo": "🎤",
};

const INSERTS = [
  { label: "notas", text: " 1 2 3 4 5 6 7" },
  { label: "pausa", text: " -" },
  { label: "oitava ↑", text: " 5'" },
  { label: "oitava ↓", text: " '5" },
  { label: "sustenido", text: " 3#" },
  { label: "bemol", text: " 3b" },
  { label: "quiáltera", text: " 5** 5*" },
  { label: "|", text: " | " },
  { label: "FIM", text: "\nFIM" },
  { label: "||:", text: " ||: " },
  { label: ":||", text: " :|| " },
  { label: "C1", text: "\n(CASA1)" },
  { label: "C2", text: "\n(CASA2)" },
  { label: "ligadura", text: " + " },
  { label: "ponto", text: "*" },
  { label: "semibreve", text: " 1 + , + , + , +" },
  { label: "mínima", text: " 1 + , +" },
];

const CORE: Record<number, string> = {
  1: "#C0001A", 2: "#ECD200", 3: "#F07300",
  4: "#00B050", 5: "#0066FF", 6: "#8B5E00", 7: "#9B5FC0",
};
function RhythmBtn({ onClick, title, children, vars }: {
  onClick: () => void; title?: string; children: React.ReactNode;
  vars: Record<string, string>;
}) {
  return (
    <button onClick={onClick} title={title}
      className="px-1.5 py-0.5 rounded leading-none transition-colors hover:brightness-125 shrink-0"
      style={{
        background: vars["--surface2"], color: vars["--text"], fontSize: 13, fontFamily: "inherit",
        border: "1px solid transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = vars["--accent"]; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = vars["--surface2"]; e.currentTarget.style.color = vars["--text"]; }}
    >{children}</button>
  );
}

const BASE_FREQ = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
const BPM = 120;
const BEAT_DUR = 60 / BPM;

type TimelineNote = {
  idx: number;
  charStart: number;
  charEnd: number;
  line: number;
  degree: number;
  freq: number;
  color: string;
  token: string;
};

function parseTimeline(s: string): TimelineNote[] {
  const out: TimelineNote[] = [];
  let globalIdx = 0;
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const token = m[0];
    if (token === "-" || token === "|") continue;
    let octaveOffset = 0;
    let degree = 0;
    let acc = 0;
    for (const ch of token) {
      if (ch === "'") octaveOffset++;
      else if (ch === ",") octaveOffset--;
    }
    const digits = token.replace(/[^0-9]/g, "");
    degree = parseInt(digits, 10);
    if (degree < 1 || degree > 7 || isNaN(degree)) continue;
    if (token.includes("#")) acc = 1;
    if (token.includes("b")) acc = -1;
    let freq = BASE_FREQ[degree - 1] * 2 ** (acc / 12);
    freq *= 2 ** octaveOffset;

    out.push({
      idx: globalIdx,
      charStart: m.index,
      charEnd: m.index + token.length,
      line: s.substring(0, m.index).split("\n").length - 1,
      degree,
      freq,
      color: CORE[degree],
      token,
    });
    globalIdx++;
  }
  return out;
}

/* ── Timeline ── */
const NOTE_W = 28;

function TimelineBar({
  notes, currentIdx, onSeek, vars,
}: {
  notes: TimelineNote[]; currentIdx: number;
  onSeek: (idx: number) => void; vars: Record<string, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (currentIdx < 0 || !scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTo({
      left: Math.max(0, currentIdx * NOTE_W - el.clientWidth / 2 + NOTE_W / 2),
      behavior: "smooth",
    });
  }, [currentIdx]);
  if (!notes.length) return null;
  return (
    <div ref={scrollRef} className="shrink-0 overflow-x-auto overflow-y-hidden"
      style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
    >
      <div className="relative" style={{ width: notes.length * NOTE_W, height: 36, minWidth: "100%" }}>
        {notes.map((n, i) => (
          <div key={i} onClick={() => onSeek(i)}
            className="absolute top-0 cursor-pointer transition-opacity hover:opacity-80"
            style={{
              left: i * NOTE_W, width: NOTE_W - 1, height: 36,
              background: n.color,
              opacity: i === currentIdx ? 1 : i < currentIdx ? 0.25 : 0.45,
              borderRight: "1px solid rgba(0,0,0,0.3)",
              boxShadow: i === currentIdx ? "inset 0 0 0 2px rgba(255,255,255,0.6)" : "none",
            }}
            title={`${n.token} (grau ${n.degree})`}
          />
        ))}
        <div className="absolute top-0 w-0.5 z-10 pointer-events-none"
          style={{
            left: currentIdx >= 0 ? currentIdx * NOTE_W : -10, height: 36,
            background: "#fff", boxShadow: "0 0 6px #fff",
            transition: "left 0.08s linear",
          }}
        />
      </div>
    </div>
  );
}

/* ── Rich audio engine ── */
function scheduleNote(ctx: AudioContext, dest: GainNode, freq: number, t: number, dur: number) {
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
  lfo.start(t); lfo.stop(t + dur);
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
  env.connect(pan); pan.connect(dest);
  osc1.start(t); osc2.start(t);
  osc1.stop(t + dur); osc2.stop(t + dur);
}

function createReverb(ctx: AudioContext): GainNode {
  const dry = ctx.createGain(); dry.gain.value = 0.7;
  const wet = ctx.createGain(); wet.gain.value = 0.2;
  const del = ctx.createDelay(0.5); del.delayTime.value = 0.12;
  const fb = ctx.createGain(); fb.gain.value = 0.3;
  del.connect(fb); fb.connect(del); fb.connect(wet);
  wet.connect(ctx.destination);
  return dry;
}

function preSchedule(ctx: AudioContext, dest: GainNode, notes: TimelineNote[], beatDur: number) {
  const now = ctx.currentTime;
  for (let i = 0; i < notes.length; i++) {
    scheduleNote(ctx, dest, notes[i].freq, now + i * beatDur, beatDur);
  }
}

export function NfpPage() {
  const { vars } = useTheme();
  const { user } = useAuth();
  const isFree = user?.plan === "free";
  const exemplos = isFree ? EXEMPLOS_FREE : EXEMPLOS_PRO;
  const [sintaxe, setSintaxe] = useState(DEFAULT_SYNTAXE);
  const [modo, setModo] = useState<"REAL" | "FORMA" | "STAFFLESS">("REAL");
  const [titulo, setTitulo] = useState("Sem título");
  const [compositor, setCompositor] = useState("");
  const [compasso, setCompasso] = useState("4/4");
  const [tonalidade, setTonalidade] = useState("c \\major");
  const [rendering, setRendering] = useState(false);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [showLy, setShowLy] = useState(false);
  const compassos = contarCompassos(sintaxe);
  const excedeuLimite = isFree && compassos > FREE_MAX_COMPASSOS;

  /* ── Audio state ── */
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const audioRef = useRef<{ ctx: AudioContext } | null>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastIdxRef = useRef(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pageRangesRef = useRef<number[]>([]);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showDictation, setShowDictation] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioWavUrl, setAudioWavUrl] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const voices = parseVoices(sintaxe);
  const orquestral = voices.length > 0;

  const handleRealAudio = useCallback(async () => {
    if (audioWavUrl) {
      audioElRef.current?.play();
      return;
    }
    setAudioLoading(true);
    try {
      const res = await fetch("/api/nfp/render/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, titulo, compasso, tonalidade }),
      });
      const data = await res.json();
      if (data.ok && data.wav) {
        const url = `data:audio/wav;base64,${data.wav}`;
        setAudioWavUrl(url);
        const audio = new Audio(url);
        audioElRef.current = audio;
        audio.play();
      } else {
        alert(data.erro || "Áudio indisponível");
      }
    } catch { alert("Erro ao gerar áudio"); }
    setAudioLoading(false);
  }, [sintaxe, titulo, compasso, audioWavUrl]);

  const notes = parseTimeline(sintaxe);

  const resultRef = useRef(result);
  resultRef.current = result;
  useEffect(() => {
    if (!result?.positions?.length) { pageRangesRef.current = []; return; }
    const ranges: number[] = [];
    let acc = 0;
    for (const pg of result.positions) { acc += pg.notas.length; ranges.push(acc); }
    pageRangesRef.current = ranges;
  }, [result]);

  function pageFromIdx(idx: number): number {
    const r = pageRangesRef.current;
    if (!r.length) return 0;
    for (let p = 0; p < r.length; p++) { if (idx < r[p]) return p; }
    return r.length - 1;
  }

  /* ── Audio stop ── */
  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) { try { audioRef.current.ctx.close(); } catch {} audioRef.current = null; }
    lastIdxRef.current = -1;
    setPlaying(false); setPaused(false); setCurrentIdx(-1);
  }, []);

  /* ── rAF sync ── */
  const syncLoop = useCallback(() => {
    const ctx = audioRef.current?.ctx;
    if (!ctx || ctx.state === "closed") return;
    const idx = Math.min(Math.floor((ctx.currentTime - startTimeRef.current) / BEAT_DUR), notes.length - 1);
    if (idx !== lastIdxRef.current) {
      lastIdxRef.current = idx;
      setCurrentIdx(idx);
      const page = pageFromIdx(idx);
      if (page !== activePage) setActivePage(page);
      const n = notes[idx];
      if (n && textareaRef.current) {
        const ta = textareaRef.current;
        const before = ta.value.substring(0, n.charStart);
        const lineNum = before.split("\n").length - 1;
        ta.scrollTop = Math.max(0, lineNum * (ta.scrollHeight / ta.value.split("\n").length) - 60);
        ta.setSelectionRange(n.charStart, n.charEnd);
      }
    }
    if (idx < notes.length - 1) { rafRef.current = requestAnimationFrame(syncLoop); }
    else { stopAudio(); }
  }, [notes, stopAudio, activePage]);

  /* ── Play ── */
  const handlePlay = useCallback(() => {
    if (paused && audioRef.current?.ctx.state === "suspended") {
      audioRef.current.ctx.resume(); setPaused(false);
      rafRef.current = requestAnimationFrame(syncLoop);
      return;
    }
    stopAudio();
    if (!notes.length) return;
    const ctx = new AudioContext();
    const dry = createReverb(ctx);
    dry.connect(ctx.destination);
    preSchedule(ctx, dry, notes, BEAT_DUR);
    startTimeRef.current = ctx.currentTime;
    lastIdxRef.current = -1;
    audioRef.current = { ctx };
    setPlaying(true); setPaused(false); setCurrentIdx(0);
    setActivePage(0);
    rafRef.current = requestAnimationFrame(syncLoop);
  }, [notes, syncLoop, stopAudio, paused]);

  /* ── Melody Recorder ── */
  const handleRecorderInsert = useCallback((cromus: string) => {
    setSintaxe((prev) => prev.trim() + "\n" + cromus);
    setShowRecorder(false);
  }, []);

  /* ── Seek ── */
  const handleSeek = useCallback((idx: number) => {
    if (idx < 0 || idx >= notes.length) return;
    const wasPlaying = playing && !paused;
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) { try { audioRef.current.ctx.close(); } catch {} audioRef.current = null; }
    if (wasPlaying || paused) {
      const ctx = new AudioContext();
      const dry = createReverb(ctx);
      dry.connect(ctx.destination);
      preSchedule(ctx, dry, notes.slice(idx), BEAT_DUR);
      startTimeRef.current = ctx.currentTime - idx * BEAT_DUR;
      lastIdxRef.current = idx - 1;
      audioRef.current = { ctx };
      setPlaying(true); setPaused(false);
    }
    setCurrentIdx(idx);
    setActivePage(pageFromIdx(idx));
    const n = notes[idx];
    if (n && textareaRef.current) {
      textareaRef.current.setSelectionRange(n.charStart, n.charEnd);
      const before = textareaRef.current.value.substring(0, n.charStart);
      const lineNum = before.split("\n").length - 1;
      textareaRef.current.scrollTop = Math.max(0, lineNum * (textareaRef.current.scrollHeight / textareaRef.current.value.split("\n").length) - 60);
    }
    if (wasPlaying || paused) rafRef.current = requestAnimationFrame(syncLoop);
  }, [notes, playing, paused, stopAudio, syncLoop]);

  /* ── Render ── */
  const handleRender = useCallback(async () => {
    if (!sintaxe.trim()) return;
    setRendering(true); setResult(null);
    try {
      const res = await fetch("/api/nfp/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, modo, titulo, compasso, tonalidade }),
      });
      setResult(await res.json());
    } catch { setResult({ ok: false, log: "Erro de conexão." }); }
    setRendering(false);
  }, [sintaxe, modo, titulo, compasso, tonalidade]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newVal = sintaxe.substring(0, start) + text + sintaxe.substring(el.selectionEnd);
    setSintaxe(newVal);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); });
  };

  const previewUrl = result?.pages?.[activePage] ? `data:image/png;base64,${result.pages[activePage]}` : null;

  /* ── Save / Export ── */
  const handleSave = useCallback(() => {
    const blob = new Blob([sintaxe], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/\s+/g, "_")}.cromus`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sintaxe, titulo]);

  const handleExportLy = useCallback(() => {
    if (!result?.ly) return;
    const blob = new Blob([result.ly], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/\s+/g, "_")}.ly`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, titulo]);

  const handleExportPdf = useCallback(async () => {
    if (!result?.pages?.length) return;
    const pdfBlob = result.pages[0];
    const res = await fetch(`data:image/png;base64,${pdfBlob}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/\s+/g, "_")}_page_${activePage + 1}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, titulo, activePage]);

  const handleExportMidi = useCallback(async () => {
    try {
      const res = await fetch("/api/nfp/export/midi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, titulo, compositor, compasso, tonalidade }),
      });
      if (!res.ok) throw new Error("MIDI export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, "_")}.mid`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("MIDI export not available yet"); }
  }, [sintaxe, titulo, compositor, compasso, tonalidade]);

  const handleExportWav = useCallback(async () => {
    try {
      const res = await fetch("/api/nfp/export/wav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, titulo, compositor, compasso, tonalidade }),
      });
      if (!res.ok) throw new Error("WAV export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, "_")}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("WAV export not available yet"); }
  }, [sintaxe, titulo, compositor, compasso, tonalidade]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".cromus,.txt,.ly,.xml,.mxl,.musicxml";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === "string") setSintaxe(text);
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ color: vars["--text"] }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center flex-wrap gap-2 px-4 py-2 shrink-0"
        style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
      >
        {/* Note Form Pro logo */}
        <div className="flex items-center gap-2 pr-3 mr-1"
          style={{ borderRight: `1px solid ${vars["--border"]}` }}
        >
          <svg width="22" height="22" viewBox="0 0 100 100">
            <polygon points="50,10 59.4,37.06 88.04,37.64 65.22,54.94 73.51,82.36 50,66 26.49,82.36 34.78,54.94 11.96,37.64 40.6,37.06"
              fill="#E8A820" />
          </svg>
          <span className="text-sm font-semibold tracking-tight"
            style={{ color: vars["--text"], fontFamily: "'DM Sans', sans-serif" }}
          >NFP</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-1 rounded"
          style={{ background: vars["--bg"], border: `1px solid ${vars["--border"]}` }}
        >
          <button onClick={handlePlay}
            disabled={playing && !paused}
            className="px-3 py-1 font-bold rounded transition-all text-base"
            style={{
              background: playing && !paused ? vars["--accent"] : vars["--surface2"],
              color: playing && !paused ? "#fff" : vars["--accent"],
              opacity: playing && !paused ? 0.6 : 1,
            }}
          >▶</button>
          <button onClick={() => {
            if (!audioRef.current) return;
            if (paused) { audioRef.current.ctx.resume(); setPaused(false); rafRef.current = requestAnimationFrame(syncLoop); }
            else { audioRef.current.ctx.suspend(); cancelAnimationFrame(rafRef.current); setPaused(true); }
          }} disabled={!playing}
            className="px-3 py-1 font-bold rounded transition-all text-base"
            style={{ background: paused ? vars["--accent"] : vars["--surface2"], color: paused ? "#fff" : vars["--textDim"], opacity: !playing ? 0.3 : 1 }}
          >⏸</button>
          <button onClick={stopAudio} disabled={!playing}
            className="px-3 py-1 font-bold rounded transition-all text-base"
            style={{ background: vars["--surface2"], color: "#C0001A", opacity: !playing ? 0.3 : 1 }}
          >■</button>
          <button onClick={() => setShowRecorder((p) => !p)}
            className="px-3 py-1 font-bold rounded transition-all text-base"
            style={{
              background: showRecorder ? vars["--accent"] : vars["--surface2"],
              color: showRecorder ? "#fff" : vars["--accent"],
            }}
          >🎵</button>
          <button onClick={() => setShowDictation((p) => !p)}
            className="px-3 py-1 font-bold rounded transition-all text-base"
            style={{
              background: showDictation ? vars["--accent"] : vars["--surface2"],
              color: showDictation ? "#fff" : vars["--accent"],
            }}
          >🎙</button>
          <button onClick={handleRealAudio} disabled={audioLoading}
            className="px-2 py-1 font-bold rounded transition-all text-base"
            style={{
              background: audioWavUrl ? "#00B050" : vars["--surface2"],
              color: audioWavUrl ? "#fff" : "#00B050",
            }}
            title={orquestral ? "Áudio orquestral (FluidSynth)" : "Áudio real (FluidSynth)"}
          >{audioLoading ? "…" : "🔊"}</button>
        </div>

        {orquestral && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px]"
            style={{ background: "#0066FF10", color: "#0066FF", border: "1px solid #0066FF20" }}
          >
            {voices.map((v, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && <span style={{ color: "#0066FF40" }}>+</span>}
                {VOICE_EMOJI[v] || "🎵"} {v}
              </span>
            ))}
          </div>
        )}

        <div className="w-px h-6" style={{ background: vars["--border"] }} />

        <select value={modo} onChange={(e) => setModo(e.target.value as "REAL" | "FORMA" | "STAFFLESS")}
          className="px-2 py-1 rounded border text-sm"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        >
          <option value="REAL">REAL</option>
          <option value="FORMA">FORMA</option>
          <option value="STAFFLESS">STAFFLESS</option>
        </select>

        <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
          className="px-2 py-1 rounded border text-sm w-32"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
          placeholder="Título"
        />

        <input value={compositor} onChange={(e) => setCompositor(e.target.value)}
          className="px-2 py-1 rounded border text-sm w-20"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
          placeholder="Autor"
        />

        <select value={compasso} onChange={(e) => setCompasso(e.target.value)}
          className="px-2 py-1 rounded border text-sm w-20"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        >
          <optgroup label="Simples">
            <option value="2/4">2/4</option>
            <option value="3/4">3/4</option>
            <option value="4/4">4/4</option>
            <option value="2/2">2/2</option>
            <option value="3/8">3/8</option>
            <option value="4/8">4/8</option>
          </optgroup>
          <optgroup label="Compostos">
            <option value="6/8">6/8</option>
            <option value="9/8">9/8</option>
            <option value="12/8">12/8</option>
          </optgroup>
          <optgroup label="Alternados">
            <option value="5/4 (2+3)">5/4 (2+3)</option>
            <option value="5/4 (3+2)">5/4 (3+2)</option>
            <option value="7/4 (3+4)">7/4 (3+4)</option>
            <option value="7/4 (4+3)">7/4 (4+3)</option>
            <option value="5/8 (2+3)">5/8 (2+3)</option>
            <option value="5/8 (3+2)">5/8 (3+2)</option>
            <option value="7/8 (3+4)">7/8 (3+4)</option>
            <option value="7/8 (4+3)">7/8 (4+3)</option>
          </optgroup>
          <optgroup label="Grandes">
            <option value="9/4">9/4</option>
            <option value="10/4">10/4</option>
            <option value="11/4">11/4</option>
            <option value="12/4">12/4</option>
            <option value="13/4">13/4</option>
            <option value="14/4">14/4</option>
            <option value="15/4">15/4</option>
            <option value="9/8">9/8</option>
            <option value="10/8">10/8</option>
            <option value="11/8">11/8</option>
            <option value="12/8">12/8</option>
            <option value="13/8">13/8</option>
            <option value="14/8">14/8</option>
            <option value="15/8">15/8</option>
          </optgroup>
        </select>

        <div className="w-px h-6" style={{ background: vars["--border"] }} />

        <select onChange={(e) => { if (e.target.value) { setSintaxe(exemplos[e.target.value as keyof typeof exemplos]); } e.target.value = ""; }}
          className="px-2 py-1 rounded border text-sm"
          style={{ background: vars["--bg"], color: vars["--textDim"], borderColor: vars["--border"] }}
          defaultValue=""
        >
          <option value="" disabled>Exemplos</option>
          {Object.keys(exemplos).map((k) => <option key={k} value={k}>{k}</option>)}
        </select>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {isFree && (
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "#F0730020", color: "#F07300" }}>
              {compassos}/{FREE_MAX_COMPASSOS}
            </span>
          )}
          <button onClick={handleRender} disabled={rendering || !sintaxe.trim() || excedeuLimite}
            className="px-4 py-1 text-sm font-semibold rounded disabled:opacity-40 transition-colors"
            style={{ background: excedeuLimite ? "#C0001A" : vars["--accent"], color: "#fff" }}
          >
            {excedeuLimite ? "Limite" : rendering ? "…" : "Renderizar"}
          </button>
        </div>
      </div>

      {/* ── Second toolbar: composer + save/export ── */}
      <div className="flex items-center flex-wrap gap-2 px-4 py-1.5 shrink-0"
        style={{ background: vars["--surface2"], borderBottom: `1px solid ${vars["--border"]}` }}
      >
        <button onClick={handleSave}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
        >💾 Salvar</button>

        <button onClick={handleImport}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
        >📂 Importar</button>

        <div className="w-px h-5" style={{ background: vars["--border"] }} />

        <button onClick={handleExportPdf}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
          disabled={!result?.ok}
        >📄 PDF</button>

        <button onClick={handleExportMidi}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
        >🎹 MIDI</button>

        <button onClick={handleExportWav}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
        >🔊 WAV</button>

        <button onClick={handleExportLy}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
          disabled={!result?.ly}
        >🎼 LilyPond</button>

        <div className="w-px h-5" style={{ background: vars["--border"] }} />

        <span className="text-[10px] font-semibold tracking-wider mr-0.5" style={{ color: vars["--textMuted"] }}>TOM</span>
        <select value={tonalidade} onChange={(e) => setTonalidade(e.target.value)}
          className="px-1.5 py-1 rounded border text-[11px] w-22"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        >
          {TONALIDADES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* ── Barra de inserção rítmica ── */}
      <div className="flex items-center gap-0.5 px-2 py-1 text-xs shrink-0 overflow-x-auto"
        style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
      >
        <span className="font-semibold mr-1 tracking-wider" style={{ color: vars["--textMuted"], fontSize: 9 }}>BARRAS</span>
        <RhythmBtn onClick={() => insertAtCursor(" | ")} title="Barra simples" vars={vars}>|</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" || ")} title="Barra dupla" vars={vars}>𝄁</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor("\nFIM")} title="Barra final" vars={vars}>𝄂</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" ||: ")} title="Abre repetição" vars={vars}>𝄆</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" :|| ")} title="Fecha repetição" vars={vars}>𝄇</RhythmBtn>
        <RhythmBtn onClick={() => {
          const el = textareaRef.current; if (!el) return;
          const start = el.selectionStart;
          setSintaxe(sintaxe.substring(0, start) + "\n(CASA1)" + sintaxe.substring(el.selectionEnd));
        }} title="Casa 1" vars={vars}>C¹</RhythmBtn>
        <RhythmBtn onClick={() => {
          const el = textareaRef.current; if (!el) return;
          const start = el.selectionStart;
          setSintaxe(sintaxe.substring(0, start) + "\n(CASA2)" + sintaxe.substring(el.selectionEnd));
        }} title="Casa 2" vars={vars}>C²</RhythmBtn>

        <div className="w-px h-4 mx-1 shrink-0" style={{ background: vars["--border"] }} />

        <span className="font-semibold mr-1 tracking-wider" style={{ color: vars["--textMuted"], fontSize: 9 }}>LIG</span>
        <RhythmBtn onClick={() => insertAtCursor(" + ")} title="Ligadura" vars={vars}>+</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor("*")} title="Nota pontuada" vars={vars}>·</RhythmBtn>

        <div className="w-px h-4 mx-1 shrink-0" style={{ background: vars["--border"] }} />

        <span className="font-semibold mr-1 tracking-wider" style={{ color: vars["--textMuted"], fontSize: 9 }}>FIGURAS</span>
        <RhythmBtn onClick={() => insertAtCursor(" 1w")} title="Semibreve" vars={vars}>𝅝</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1h")} title="Mínima" vars={vars}>𝅗𝅥</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1q")} title="Semínima" vars={vars}>♩</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1e")} title="Colcheia" vars={vars}>♪</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1s")} title="Semicolcheia" vars={vars}>𝅘𝅥𝅰</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1t")} title="Fusa" vars={vars}>𝅘𝅥𝅱</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1i")} title="Semifusa" vars={vars}>𝅘𝅥𝅲</RhythmBtn>

        <div className="w-px h-4 mx-1 shrink-0" style={{ background: vars["--border"] }} />

        <span className="font-semibold mr-1 tracking-wider" style={{ color: vars["--textMuted"], fontSize: 9 }}>PAUSAS</span>
        <RhythmBtn onClick={() => insertAtCursor(" 0w")} title="Pausa de semibreve" vars={vars}>𝄻</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0h")} title="Pausa de mínima" vars={vars}>𝄼</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0q")} title="Pausa de semínima" vars={vars}>𝄽</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0e")} title="Pausa de colcheia" vars={vars}>𝄾</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0s")} title="Pausa de semicolcheia" vars={vars}>𝄿</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0t")} title="Pausa de fusa" vars={vars}>𝅀</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0i")} title="Pausa de semifusa" vars={vars}>𝅁</RhythmBtn>
      </div>

      {showRecorder && (
        <RecorderPanel
          onInsert={handleRecorderInsert}
          onClose={() => setShowRecorder(false)}
          vars={vars}
        />
      )}

      {showDictation && (
        <VoiceDictationPanel
          onInsert={(syntax) => setSintaxe(syntax)}
          onClose={() => setShowDictation(false)}
          vars={vars}
        />
      )}

      {/* ── Timeline ── */}
      {(playing || paused || currentIdx >= 0) && (
        <TimelineBar notes={notes} currentIdx={currentIdx} onSeek={handleSeek} vars={vars} />
      )}

      {/* ── Editor + Preview ── */}
      <div className="flex-1 flex min-h-0">
        <div className="flex flex-col w-1/2 min-w-0" style={{ borderRight: `1px solid ${vars["--border"]}` }}>
          <textarea ref={textareaRef} value={sintaxe} onChange={(e) => setSintaxe(e.target.value)}
            className="flex-1 p-4 text-base font-mono resize-none focus:outline-none border-0"
            style={{ background: vars["--bg"], color: vars["--text"] }}
            placeholder="Digite a sintaxe Cromus aqui..."
          />
          <div className="flex items-center gap-1 px-3 py-1.5 text-sm shrink-0 flex-wrap"
            style={{ background: vars["--surface"], borderTop: `1px solid ${vars["--border"]}` }}
          >
            {INSERTS.map((ins) => (
              <button key={ins.label} onClick={() => insertAtCursor(ins.text)}
                className="px-2 py-0.5 rounded transition-colors hover:brightness-125"
                style={{ background: vars["--surface2"], color: vars["--textDim"] }}
              >{ins.label}</button>
            ))}
            <div className="flex-1" />
            <button onClick={async () => {
              if (!sintaxe.trim()) return;
              try {
                const res = await fetch("/api/nfp/normalizar", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ texto: sintaxe }),
                });
                const data = await res.json();
                if (data.ok) setSintaxe(data.sintaxe);
              } catch {}
            }}
              className="px-2 py-0.5 rounded transition-colors hover:brightness-125 font-semibold"
              style={{ background: vars["--accent"] + "20", color: vars["--accent"] }}
            >✨ Normalizar</button>
          </div>
        </div>

        <div className="flex flex-col w-1/2 min-w-0">
          {result && !result.ok && (
            <div className="m-3 p-3 rounded text-xs" style={{ background: "#C0001A15", color: "#C0001A" }}>
              <strong>Erro:</strong>
              <pre className="mt-1 whitespace-pre-wrap font-mono">{result.log}</pre>
            </div>
          )}

          {result && result.ok && previewUrl ? (
            <>
              <div className="flex items-center justify-between px-3 py-1.5 text-[11px] shrink-0"
                style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
              >
                <span style={{ color: vars["--textDim"] }}>
                  {result.pages!.length > 1 ? `Pág. ${activePage + 1}/${result.pages!.length}` : "Partitura"}
                </span>
                <div className="flex items-center gap-2">
                  {result.pages!.length > 1 && (
                    <div className="flex gap-0.5">
                      {result.pages!.map((_, i) => (
                        <button key={i} onClick={() => setActivePage(i)}
                          className="w-4 h-4 text-[10px] rounded font-medium"
                          style={{
                            background: i === activePage ? vars["--accent"] : vars["--surface2"],
                            color: i === activePage ? "#fff" : vars["--textDim"],
                          }}
                        >{i + 1}</button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setShowLy(!showLy)}
                    className="px-2 py-0.5 rounded"
                    style={{ background: vars["--surface2"], color: vars["--textDim"] }}
                  >{showLy ? "Partitura" : "LilyPond"}</button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex items-start justify-center p-3 min-h-0">
                {showLy && result.ly ? (
                  <pre className="w-full h-full p-3 text-xs font-mono rounded overflow-auto"
                    style={{ background: vars["--surface"], color: vars["--text"] }}
                  >{result.ly}</pre>
                ) : (
                  <img src={previewUrl} alt="Partitura"
                    className="max-w-full shadow-lg"
                    style={{ border: "1px solid #333" }}
                  />
                )}
              </div>

              {result.log && (
                <details className="shrink-0 text-[11px] px-3 py-1"
                  style={{ color: vars["--textMuted"], borderTop: `1px solid ${vars["--border"]}` }}
                >
                  <summary className="cursor-pointer hover:underline">Log</summary>
                  <pre className="mt-1 p-2 rounded text-[10px] overflow-auto max-h-24"
                    style={{ background: vars["--surface"] }}>{result.log}</pre>
                </details>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ background: vars["--bg"] }}>
              <div className="text-center space-y-2" style={{ color: vars["--textMuted"] }}>
                <div className="text-4xl opacity-30">♩</div>
                <p className="text-xs">Escreva a sintaxe e clique em Renderizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
