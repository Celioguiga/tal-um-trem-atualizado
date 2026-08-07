import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../lib/theme";
import { useAuth } from "../../lib/auth";
import { RecorderPanel } from "./RecorderPanel";
import { getVersions, getCurrentVersion } from "../../lib/versions";
import { VoiceDictationPanel } from "./VoiceDictationPanel";
import { MidiControllerPanel } from "./MidiControllerPanel";
import { transposeCromus, transposeKey, TRANSPOSE_INTERVALS } from "../../lib/transpose";

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

const INSTRUMENTOS = Object.keys(VOICE_EMOJI);

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
  /* posição e duração em BATIDAS (não segundos) -- várias notas coladas
     num mesmo tempo (ex.: "12") dividem 1 batida entre si; ver scanBeatGroup */
  beatStart: number;
  beatFrac: number;
};

type MicroNote =
  | { rest: false; degree: number; octaveOffset: number; accidental: number; parcelas: number }
  | { rest: true; parcelas: number };

/* Lê uma sequência de notas "coladas" que dividem um mesmo tempo -- ex.:
   "12" = 2 notas, cada uma com metade do tempo; "7**6*" = tercina (7 com
   2 parcelas + 6 com 1 parcela, de 3 no total). Apóstrofo antes do dígito =
   oitava abaixo, depois = oitava acima; # / b = acidente; asteriscos =
   parcelas (Bíblia §5). */
function scanBeatGroup(text: string): MicroNote[] {
  const out: MicroNote[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "-") {
      i++;
      let ast = 0;
      while (text[i] === "*") { ast++; i++; }
      out.push({ rest: true, parcelas: Math.max(1, ast) });
      continue;
    }
    let leadingApos = 0;
    while (text[i] === "'") { leadingApos++; i++; }
    if (!/[1-7]/.test(text[i] || "")) { i++; continue; }
    const degree = parseInt(text[i], 10); i++;
    let trailingApos = 0, accidental = 0, ast = 0;
    while (i < text.length) {
      const c = text[i];
      if (c === "'") { trailingApos++; i++; }
      else if (c === "#") { accidental = 1; i++; }
      else if (c === "b") { accidental = -1; i++; }
      else if (c === "*") { ast++; i++; }
      else break;
    }
    out.push({ rest: false, degree, octaveOffset: trailingApos - leadingApos, accidental, parcelas: Math.max(1, ast) });
  }
  return out;
}

function parseTimeline(s: string): TimelineNote[] {
  /* Vírgula e barra de compasso separam TEMPOS (Bíblia §5) -- viram
     delimitadores como espaço, mantendo o mesmo tamanho de string pra não
     desalinhar charStart/charEnd (usados pro highlight na textarea).
     ||: :|| (CASA n) e FIM são marcadores estruturais: removidos por ora
     (ainda toca linear, sem desenrolar o ritornello -- casa 1 e 2 seguidas). */
  const clean = s
    .replace(/\|\|:|:\|\|/g, (mm) => " ".repeat(mm.length))
    .replace(/\(\s*CASA\s*\d+\s*\)/gi, (mm) => " ".repeat(mm.length))
    .replace(/\bFIM\b/gi, (mm) => " ".repeat(mm.length))
    .replace(/[|,]/g, " ");

  const out: TimelineNote[] = [];
  let globalIdx = 0;
  let beatCursor = 0;
  const groupRe = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = groupRe.exec(clean)) !== null) {
    const group = m[0];
    const micros = scanBeatGroup(group);
    if (!micros.length) continue;
    const total = micros.reduce((sum, mn) => sum + mn.parcelas, 0);
    let offset = 0;
    for (const mn of micros) {
      const frac = mn.parcelas / total;
      if (!mn.rest) {
        const freq = BASE_FREQ[mn.degree - 1] * 2 ** (mn.accidental / 12) * 2 ** mn.octaveOffset;
        out.push({
          idx: globalIdx++,
          charStart: m.index,
          charEnd: m.index + group.length,
          line: s.substring(0, m.index).split("\n").length - 1,
          degree: mn.degree,
          freq,
          color: CORE[mn.degree],
          token: group,
          beatStart: beatCursor + offset,
          beatFrac: frac,
        });
      }
      offset += frac;
    }
    beatCursor += 1;
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
let _masterVolume = 0.7;
export function setMasterVolume(v: number) { _masterVolume = Math.max(0, Math.min(1, v)); }

function scheduleNote(ctx: AudioContext, dest: GainNode, freq: number, t: number, dur: number) {
  const vol = _masterVolume;
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
  env.gain.linearRampToValueAtTime(1 * vol, t + 0.015);
  env.gain.linearRampToValueAtTime(0.6 * vol, t + 0.065);
  env.gain.setValueAtTime(0.6 * vol, t + dur * 0.7);
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

function preSchedule(ctx: AudioContext, dest: GainNode, notes: TimelineNote[], beatDur: number, baseBeat = 0) {
  const now = ctx.currentTime;
  for (const n of notes) {
    scheduleNote(ctx, dest, n.freq, now + (n.beatStart - baseBeat) * beatDur, n.beatFrac * beatDur);
  }
}

export function NfpPage() {
  const { vars } = useTheme();
  const { user } = useAuth();
  const isFree = user?.plan === "free";
  const exemplos = isFree ? EXEMPLOS_FREE : EXEMPLOS_PRO;
  const [sintaxe, setSintaxe] = useState(DEFAULT_SYNTAXE);
  const [modo, setModo] = useState<"REAL" | "FORMA" | "REAL_NOTA" | "STAFFLESS">("REAL");
  const [titulo, setTitulo] = useState("Sem título");
  const [compositor, setCompositor] = useState("");
  const [compasso, setCompasso] = useState("4/4");
  const [tonalidade, setTonalidade] = useState("c \\major");
  const [clef, setClef] = useState("G_2");
  const [rendering, setRendering] = useState(false);
  const [result, setResult] = useState<RenderResult | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [showLy, setShowLy] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  /* ── Audio state ── */
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const audioRef = useRef<{ ctx: AudioContext } | null>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const lastIdxRef = useRef(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pageRangesRef = useRef<number[]>([]);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showDictation, setShowDictation] = useState(false);
  const [showMidiController, setShowMidiController] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("nfp_volume");
    return saved ? parseFloat(saved) : 0.7;
  });
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioWavUrl, setAudioWavUrl] = useState<string | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMasterVolume(volume);
    localStorage.setItem("nfp_volume", String(volume));
  }, [volume]);

  const voices = parseVoices(sintaxe);
  const orquestral = voices.length > 0;

  const handleRealAudio = useCallback(async () => {
    if (audioWavUrl) {
      audioElRef.current?.play().catch(e => console.warn("Playback:", e));
      return;
    }
    setAudioLoading(true);
    try {
      const res = await fetch("http://localhost:4242/render/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, titulo, compasso, tonalidade, clef }),
      });
      const data = await res.json();
      if (data.ok && data.wav) {
        const binary = atob(data.wav);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        setAudioWavUrl(url);
        const audio = new Audio(url);
        audioElRef.current = audio;
        await audio.play();
      } else {
        alert(data.erro || "Áudio indisponível");
      }
    } catch (e) { alert("Erro ao gerar áudio: " + (e as Error).message); }
    setAudioLoading(false);
  }, [sintaxe, titulo, compasso, tonalidade, clef, audioWavUrl]);

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
    setPlaying(false); setPaused(false); setCurrentIdx(-1); setCurrentPos(null);
  }, []);

  /* ── rAF sync ── */
  const syncLoop = useCallback(() => {
    const ctx = audioRef.current?.ctx;
    if (!ctx || ctx.state === "closed") return;
    const elapsedBeats = (ctx.currentTime - startTimeRef.current) / BEAT_DUR;
    /* notas em ordem crescente de beatStart -- avança enquanto a próxima já
       deveria ter começado (várias notas podem caber dentro de 1 batida) */
    let idx = lastIdxRef.current;
    while (idx + 1 < notes.length && notes[idx + 1].beatStart <= elapsedBeats) idx++;
    if (idx !== lastIdxRef.current) {
      lastIdxRef.current = idx;
      setCurrentIdx(idx);
      const page = pageFromIdx(idx);
      if (page !== activePage) setActivePage(page);
      // Highlight na partitura
      const pos = resultRef.current?.positions?.[page]?.notas?.[idx];
      if (pos) setCurrentPos(pos);
      const n = notes[idx];
      if (n && textareaRef.current) {
        const ta = textareaRef.current;
        const before = ta.value.substring(0, n.charStart);
        const lineNum = before.split("\n").length - 1;
        ta.scrollTop = Math.max(0, lineNum * (ta.scrollHeight / ta.value.split("\n").length) - 60);
        ta.setSelectionRange(n.charStart, n.charEnd);
      }
    }
    const last = notes[notes.length - 1];
    const totalBeats = last ? last.beatStart + last.beatFrac : 0;
    if (elapsedBeats < totalBeats) { rafRef.current = requestAnimationFrame(syncLoop); }
    else { stopAudio(); }
  }, [notes, stopAudio, activePage]);

  /* ── Play ── */
  const handlePlay = useCallback(async () => {
    if (paused && audioRef.current?.ctx.state === "suspended") {
      await audioRef.current.ctx.resume(); setPaused(false);
      rafRef.current = requestAnimationFrame(syncLoop);
      return;
    }
    stopAudio();
    if (!notes.length) return;
    try {
      const ctx = new AudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      const dry = createReverb(ctx);
      dry.connect(ctx.destination);
      preSchedule(ctx, dry, notes, BEAT_DUR);
      startTimeRef.current = ctx.currentTime;
      lastIdxRef.current = -1;
      audioRef.current = { ctx };
      setPlaying(true); setPaused(false); setCurrentIdx(0);
      setActivePage(0);
      rafRef.current = requestAnimationFrame(syncLoop);
    } catch (e) { console.warn("Playback error:", e); }
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
      const seekBeat = notes[idx].beatStart;
      preSchedule(ctx, dry, notes.slice(idx), BEAT_DUR, seekBeat);
      startTimeRef.current = ctx.currentTime - seekBeat * BEAT_DUR;
      lastIdxRef.current = idx - 1;
      audioRef.current = { ctx };
      setPlaying(true); setPaused(false);
    }
    setCurrentIdx(idx);
    const page = pageFromIdx(idx);
    setActivePage(page);
    const ppos = resultRef.current?.positions?.[page]?.notas?.[idx];
    if (ppos) setCurrentPos(ppos);
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
        body: JSON.stringify({ sintaxe, modo, titulo, compasso, tonalidade, clef }),
      });
      const data = await res.json();
      setResult(data);
      setRenderCount((c) => c + 1);
    } catch { setResult({ ok: false, log: "Erro de conexão." }); }
    setRendering(false);
  }, [sintaxe, modo, titulo, compasso, tonalidade, clef]);

  /* ── Auto-render on changes (debounced) ── */
  const autoRenderRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (autoRenderRef.current) clearTimeout(autoRenderRef.current);
    autoRenderRef.current = setTimeout(() => { handleRender(); }, 600);
    return () => { if (autoRenderRef.current) clearTimeout(autoRenderRef.current); };
  }, [sintaxe, modo, compasso, tonalidade, clef]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const newVal = sintaxe.substring(0, start) + text + sintaxe.substring(el.selectionEnd);
    setSintaxe(newVal);
    requestAnimationFrame(() => { el.selectionStart = el.selectionEnd = start + text.length; el.focus(); });
  };

  const previewUrl = result?.pages?.[activePage] ? `data:image/png;base64,${result.pages[activePage]}#t=${Date.now()}` : null;

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
      const res = await fetch("http://localhost:4242/export/midi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, titulo, compositor, compasso, tonalidade, clef }),
      });
      const data = await res.json();
      if (!data.ok || !data.midi) throw new Error(data.erro || "MIDI export failed");
      const byteStr = atob(data.midi);
      const ab = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) ab[i] = byteStr.charCodeAt(i);
      const blob = new Blob([ab], { type: "audio/midi" });
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
      const res = await fetch("http://localhost:4242/export/wav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, titulo, compositor, compasso, tonalidade, clef }),
      });
      const data = await res.json();
      if (!data.ok || !data.wav) throw new Error(data.erro || "WAV export failed");
      const byteStr = atob(data.wav);
      const ab = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) ab[i] = byteStr.charCodeAt(i);
      const blob = new Blob([ab], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titulo.replace(/\s+/g, "_")}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { alert("WAV export not available yet"); }
  }, [sintaxe, titulo, compositor, compasso, tonalidade]);

  const handleAnalise = useCallback(async () => {
    if (!sintaxe.trim()) { alert("Digite uma sintaxe primeiro."); return; }
    try {
      const res = await fetch("http://localhost:4242/analise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sintaxe, tonalidade }),
      });
      const d = await res.json();
      if (!d.ok) { alert("Erro: " + d.erro); return; }
      // Monta o relatório visual
      let html = `<div style="font:13px system-ui;padding:16px;max-width:700px">`;
      html += `<h3 style="margin:0 0 12px">Análise Fatorial da Melodia</h3>`;
      html += `<div style="font:11px monospace;color:#888;margin-bottom:12px">`;
      html += `Tonalidade: <b>${d.tonalidade}</b> · Total de notas: <b>${d.total_notas}</b></div>`;
      html += `<table style="width:100%;border-collapse:collapse;font:12px monospace">`;
      html += `<tr style="border-bottom:2px solid #333;text-align:left">`;
      html += `<th>Grau</th><th>Nota</th><th>Forma</th><th>Personagem</th><th>Incidência</th><th>%</th></tr>`;
      for (const g of d.relatorio) {
        const barW = Math.max(2, g.percentual * 2);
        html += `<tr style="border-bottom:1px solid #333">`;
        html += `<td style="color:${g.cor};font-weight:700">${g.grau_romano}</td>`;
        html += `<td>${g.nota}</td>`;
        html += `<td>${g.forma_rnfg}</td>`;
        html += `<td style="font-size:11px">${g.personagem}</td>`;
        html += `<td><span style="display:inline-block;width:${barW}px;height:12px;background:${g.cor};border-radius:2px;vertical-align:middle;margin-right:4px"></span>${g.incidencia}</td>`;
        html += `<td>${g.percentual}%</td></tr>`;
      }
      html += `</table>`;
      html += `</div>`;
      // Abre em modal
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:100";
      overlay.innerHTML = `<div style="background:#1d2129;border:1px solid #333;border-radius:10px;padding:22px;max-width:720px;max-height:80vh;overflow:auto;text-align:left">${html}<div style="margin-top:16px;text-align:center"><button onclick="this.closest('div[style]').remove()" style="padding:6px 16px;border:1px solid #333;border-radius:6px;background:#20242d;color:#e8e6df;cursor:pointer">Fechar</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    } catch (e: any) { alert("Erro na análise: " + e.message); }
  }, [sintaxe, tonalidade]);

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

        <select value={getCurrentVersion().label}
          onChange={(e) => { const target = e.target.value; for (const v of getVersions()) { if (v.label === target) { window.location.href = v.url; return; } } }}
          className="px-1.5 py-1 rounded border text-[10px]"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"], cursor: "pointer" }}
        >
          {getVersions().map((v) => (
            <option key={v.label} value={v.label}>{v.label}</option>
          ))}
        </select>

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
          <button onClick={() => setShowMidiController((p) => !p)}
            className="px-3 py-1 font-bold rounded transition-all text-base"
            style={{
              background: showMidiController ? vars["--accent"] : vars["--surface2"],
              color: showMidiController ? "#fff" : "#8B5E00",
            }}
            title="Controlador MIDI"
          >🎹</button>
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
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px]"
            style={{ background: "#0066FF10", border: "1px solid #0066FF25" }}
          >
            <span className="font-semibold text-[10px] tracking-wider px-1.5 py-0.5 rounded shrink-0"
              style={{ background: "#0066FF", color: "#fff" }}
            >{voices.length} {voices.length === 1 ? "voz" : "vozes"}</span>
            {voices.map((v, i) => (
              <span key={i} className="flex items-center gap-1 px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{ background: "#ffffff08", border: "1px solid #ffffff12" }}
              >
                {VOICE_EMOJI[v] || "🎵"}
                <span style={{ color: vars["--text"] }}>{v}</span>
              </span>
            ))}
            <button
              onClick={() => {
                setSintaxe(prev => prev + `\n--- ${INSTRUMENTOS[0]}`);
                setTimeout(() => {
                  const ta = textareaRef.current;
                  if (ta) { ta.focus(); ta.selectionStart = ta.selectionEnd = ta.value.length; }
                }, 0);
              }}
              className="flex items-center justify-center w-5 h-5 rounded font-bold leading-none transition-colors hover:brightness-125 shrink-0"
              style={{ background: vars["--surface2"], color: vars["--textMuted"], fontSize: 15, border: `1px solid ${vars["--border"]}` }}
              title="Adicionar voz"
            >+</button>
          </div>
        )}

        <div className="w-px h-6" style={{ background: vars["--border"] }} />

        <select value={modo} onChange={(e) => setModo(e.target.value as "REAL" | "FORMA" | "REAL_NOTA" | "STAFFLESS")}
          className="px-2 py-1 rounded border text-sm"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        >
          <option value="REAL">REAL — cores + formas fixas</option>
          <option value="FORMA">FORMA — formas pretas</option>
          <option value="REAL_NOTA">REAL NOTA — formas por tonalidade</option>
          <option value="STAFFLESS">Sem Pentagrama</option>
        </select>

        <select value={clef} onChange={(e) => setClef(e.target.value)}
          className="px-2 py-1 rounded border text-[11px] w-44"
          style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
        >
          <option value="G_2">Clave de Sol (linha 2)</option>
          <option value="G_1">Clave de Sol (linha 1)</option>
          <option value="F_4">Clave de Fá (linha 4)</option>
          <option value="F_3">Clave de Fá (linha 3)</option>
          <option value="C_1">Clave de Dó (linha 1)</option>
          <option value="C_2">Clave de Dó (linha 2)</option>
          <option value="C_3">Clave de Dó (linha 3)</option>
          <option value="C_4">Clave de Dó (linha 4)</option>
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
          <button onClick={handleRender} disabled={rendering || !sintaxe.trim()}
            className="px-4 py-1 text-sm font-semibold rounded disabled:opacity-40 transition-colors"
            style={{ background: vars["--accent"], color: "#fff" }}
          >
            {rendering ? "…" : "Renderizar"}
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

        <button onClick={handleAnalise}
          className="px-3 py-1 text-sm font-medium rounded"
          style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
        >📊 Análise</button>

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

        <div className="w-px h-5" style={{ background: vars["--border"] }} />

        <span className="text-[10px] font-semibold tracking-wider mr-0.5" style={{ color: vars["--textMuted"] }}>TRANSPOSICAO</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => {
              setSintaxe((prev) => transposeCromus(prev, -1));
              setTonalidade((prev) => transposeKey(prev, -1));
            }}
            className="px-2 py-1 text-sm font-bold rounded"
            style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
            title="Transpor -1 grau"
          >↓</button>
          <button
            onClick={() => {
              setSintaxe((prev) => transposeCromus(prev, 1));
              setTonalidade((prev) => transposeKey(prev, 1));
            }}
            className="px-2 py-1 text-sm font-bold rounded"
            style={{ background: vars["--bg"], color: vars["--text"], border: `1px solid ${vars["--border"]}` }}
            title="Transpor +1 grau"
          >↑</button>
          <select
            onChange={(e) => {
              const v = parseInt(e.target.value);
              if (!isNaN(v)) {
                setSintaxe((prev) => transposeCromus(prev, v));
                setTonalidade((prev) => transposeKey(prev, v));
              }
              e.target.value = "";
            }}
            className="px-1.5 py-1 rounded border text-[11px]"
            style={{ background: vars["--bg"], color: vars["--text"], borderColor: vars["--border"] }}
            defaultValue=""
          >
            <option value="" disabled>Intervalo...</option>
            {TRANSPOSE_INTERVALS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Barra de inserção rítmica ── */}
      <div className="flex items-center gap-0.5 px-2 py-1 text-xs shrink-0 overflow-x-auto"
        style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
      >
        <span className="font-semibold mr-1 tracking-wider" style={{ color: vars["--textMuted"], fontSize: 9 }}>BARRAS</span>
        <RhythmBtn onClick={() => insertAtCursor(" | ")} title="Barra simples (|)" vars={vars}>|</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" || ")} title="Barra dupla (||)" vars={vars}>||</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor("\nFIM")} title="Barra final" vars={vars}>=|</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" ||: ")} title="Abre repetição (||:)" vars={vars}>|:</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" :|| ")} title="Fecha repetição (:||)" vars={vars}>:|</RhythmBtn>
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
        <RhythmBtn onClick={() => insertAtCursor(" 1w")} title="Semibreve" vars={vars}>1/1</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1h")} title="Mínima" vars={vars}>1/2</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1q")} title="Semínima" vars={vars}>1/4</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1e")} title="Colcheia" vars={vars}>1/8</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1s")} title="Semicolcheia" vars={vars}>1/16</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1t")} title="Fusa" vars={vars}>1/32</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 1i")} title="Semifusa" vars={vars}>1/64</RhythmBtn>

        <div className="w-px h-4 mx-1 shrink-0" style={{ background: vars["--border"] }} />

        <span className="font-semibold mr-1 tracking-wider" style={{ color: vars["--textMuted"], fontSize: 9 }}>PAUSAS</span>
        <RhythmBtn onClick={() => insertAtCursor(" 0w")} title="Pausa de semibreve" vars={vars}>P1</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0h")} title="Pausa de mínima" vars={vars}>P2</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0q")} title="Pausa de semínima" vars={vars}>P4</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0e")} title="Pausa de colcheia" vars={vars}>P8</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0s")} title="Pausa de semicolcheia" vars={vars}>P16</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0t")} title="Pausa de fusa" vars={vars}>P32</RhythmBtn>
        <RhythmBtn onClick={() => insertAtCursor(" 0i")} title="Pausa de semifusa" vars={vars}>P64</RhythmBtn>
      </div>

      {showMidiController && (
        <MidiControllerPanel
          onInsert={handleRecorderInsert}
          vars={vars}
          volume={volume}
          onVolumeChange={setVolume}
        />
      )}

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
          <div className="flex items-center justify-between px-3 py-1 shrink-0 text-[11px]"
            style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
          >
            <span style={{ color: vars["--textMuted"], fontWeight: 600, letterSpacing: "0.04em" }}>SINTAXE</span>
            {!orquestral && (
              <span style={{ color: vars["--textMuted"], opacity: 0.5 }}>
                <code style={{ background: vars["--surface2"], padding: "0 3px", borderRadius: 2 }}>--- Nome</code> = nova voz
              </span>
            )}
            {orquestral && (
              <span style={{ color: "#0066FF", opacity: 0.7 }}>
                {voices.length} {voices.length === 1 ? "voz" : "vozes"} orquestrais
              </span>
            )}
          </div>
          {orquestral && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 shrink-0 overflow-x-auto"
              style={{ background: vars["--surface"], borderBottom: `1px solid ${vars["--border"]}` }}
            >
              {voices.map((v, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded text-[11px] whitespace-nowrap"
                  style={{ background: "#0066FF08", border: "1px solid #0066FF20" }}
                >
                  <span>{VOICE_EMOJI[v] || "🎵"}</span>
                  <select value={v}
                    onChange={(e) => {
                      const lines = sintaxe.split("\n");
                      let found = 0;
                      for (let j = 0; j < lines.length; j++) {
                        const m = lines[j].match(/^---\s*(.+?)(?::|$)/);
                        if (m) {
                          if (found === i) { lines[j] = lines[j].replace(m[1], e.target.value); break; }
                          found++;
                        }
                      }
                      setSintaxe(lines.join("\n"));
                    }}
                    className="px-1 py-0 rounded border-none text-[11px] bg-transparent"
                    style={{ color: vars["--text"] }}
                  >
                    {INSTRUMENTOS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                  <span className="text-[10px] opacity-50">{voices.length}ª voz</span>
                </div>
              ))}
              <button onClick={() => setSintaxe(prev => prev + `\n--- ${INSTRUMENTOS[0]}`)}
                className="px-2 py-1 rounded text-[11px] font-medium shrink-0"
                style={{ background: vars["--surface2"], color: vars["--accent"], border: `1px solid ${vars["--border"]}` }}
              >+ voz</button>
            </div>
          )}
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
                  <div className="relative inline-block">
                    <img key={`page-${activePage}-${renderCount}`} src={previewUrl} alt="Partitura"
                      className="max-w-full shadow-lg"
                      style={{ border: "1px solid #333" }}
                      ref={(el) => {
                        // Guarda ref para calcular escala
                        if (el) imgRef.current = el;
                      }}
                    />
                    {currentPos && result?.positions?.[activePage] && (
                      <div style={{
                        position: "absolute",
                        left: `${(currentPos.x / (result.positions[activePage].w || 1)) * 100}%`,
                        top: `${(currentPos.y / (result.positions[activePage].h || 1)) * 100}%`,
                        width: 8, height: 8,
                        borderRadius: "50%",
                        background: "rgba(255,255,0,0.8)",
                        boxShadow: "0 0 12px rgba(255,255,0,0.6)",
                        transform: "translate(-50%, -50%)",
                        pointerEvents: "none",
                        transition: "left 0.08s linear, top 0.08s linear",
                        zIndex: 10,
                      }} />
                    )}
                  </div>
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
