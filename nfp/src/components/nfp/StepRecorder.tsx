import { useState, useRef, useCallback } from "react";
import { LiveSynth, degreeToFreq } from "../../lib/liveSynth";

const DEGREES = [1, 2, 3, 4, 5, 6, 7] as const;
const NUM_STEPS = 16;
const NOTE_COLORS: Record<number, string> = {
  1: "#C0001A", 2: "#ECD200", 3: "#F07300",
  4: "#00B050", 5: "#0066FF", 6: "#8B5E00", 7: "#9B5FC0",
};

type StepGrid = (number | null)[][];

type Props = {
  onConfirm: (cromus: string) => void;
  onCancel: () => void;
};

export function StepRecorder({ onConfirm, onCancel }: Props) {
  const [grid, setGrid] = useState<StepGrid>(() =>
    DEGREES.map(() => Array(NUM_STEPS).fill(null))
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(0);
  const synthRef = useRef<LiveSynth | null>(null);
  const getSynth = useCallback(() => {
    if (!synthRef.current) synthRef.current = new LiveSynth();
    return synthRef.current;
  }, []);

  const toggleCell = useCallback((degreeIdx: number, step: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      const wasNull = next[degreeIdx][step] === null;
      next[degreeIdx][step] = wasNull ? degreeIdx + 1 : null;
      if (wasNull) {
        getSynth().pluck(degreeToFreq(degreeIdx + 1), 0.25);
      }
      return next;
    });
  }, [getSynth]);

  const clearAll = useCallback(() => {
    setGrid(DEGREES.map(() => Array(NUM_STEPS).fill(null)));
    setCurrentStep(0);
  }, []);

  const gridToCromus = useCallback((): string => {
    const steps: string[] = [];
    for (let s = 0; s < NUM_STEPS; s++) {
      let note: string | null = null;
      for (let d = DEGREES.length - 1; d >= 0; d--) {
        if (grid[d][s] !== null) {
          note = String(grid[d][s]);
          break;
        }
      }
      steps.push(note || "-");
    }
    const lines: string[] = [];
    for (let i = 0; i < steps.length; i += 8) {
      lines.push(steps.slice(i, i + 8).join(" "));
    }
    return lines.join("\n");
  }, [grid]);

  const handlePlayPreview = useCallback(() => {
    if (playing) {
      setPlaying(false);
      setCurrentStep(0);
      cancelAnimationFrame(playRef.current);
      return;
    }
    setPlaying(true);
    setCurrentStep(0);
    const ctx = new AudioContext();
    const baseFreq = 261.63;
    const startTime = ctx.currentTime;

    const playStep = (step: number) => {
      if (step >= NUM_STEPS) {
        setPlaying(false);
        setCurrentStep(0);
        ctx.close();
        return;
      }
      setCurrentStep(step);
      for (let d = 0; d < DEGREES.length; d++) {
        if (grid[d][step] !== null) {
          const freq = baseFreq * 2 ** ((grid[d][step] as number - 1) / 12);
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          env.gain.setValueAtTime(0, startTime + step * 0.25);
          env.gain.linearRampToValueAtTime(0.5, startTime + step * 0.25 + 0.02);
          env.gain.linearRampToValueAtTime(0, startTime + step * 0.25 + 0.2);
          osc.connect(env);
          env.connect(ctx.destination);
          osc.start(startTime + step * 0.25);
          osc.stop(startTime + step * 0.25 + 0.25);
          break;
        }
      }
      playRef.current = window.setTimeout(() => playStep(step + 1), 250);
    };
    playStep(0);
  }, [grid, playing]);

  const handleConfirm = useCallback(() => {
    onConfirm(gridToCromus());
  }, [gridToCromus, onConfirm]);

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Step Sequencer — 16 passos</span>
        <div className="flex gap-1">
          <button onClick={handlePlayPreview}
            className="px-2 py-0.5 text-xs rounded font-medium"
            style={{ background: playing ? "#0066FF" : "#333", color: "#fff" }}
          >
            {playing ? "■" : "▶"}
          </button>
          <button onClick={clearAll}
            className="px-2 py-0.5 text-xs rounded"
            style={{ background: "#333", color: "#999" }}
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid gap-px" style={{
          gridTemplateColumns: `24px repeat(${NUM_STEPS}, minmax(20px, 1fr))`,
        }}>
          <div />
          {Array.from({ length: NUM_STEPS }, (_, i) => (
            <div key={i} className="text-center text-[9px]"
              style={{ color: i === currentStep ? "#fff" : "#555" }}
            >
              {i + 1}
            </div>
          ))}

          {DEGREES.map((degree, dIdx) => (
            <>
              <div key={`label-${degree}`}
                className="text-[10px] font-bold flex items-center justify-center h-5"
                style={{ color: NOTE_COLORS[degree] }}
              >
                {degree}
              </div>
              {Array.from({ length: NUM_STEPS }, (_, s) => (
                <button
                  key={`cell-${dIdx}-${s}`}
                  onClick={() => toggleCell(dIdx, s)}
                  className="h-5 rounded-sm transition-all"
                  style={{
                    background: grid[dIdx][s] !== null
                      ? NOTE_COLORS[grid[dIdx][s] as number]
                      : s % 4 === 0
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.03)",
                    border: s === currentStep ? "1px solid rgba(255,255,255,0.5)" : "1px solid transparent",
                    opacity: grid[dIdx][s] !== null ? 1 : 0.5,
                  }}
                />
              ))}
            </>
          ))}
        </div>
      </div>

      <div className="flex gap-1 text-[10px] justify-center">
        <span style={{ color: "#555" }}>Clique para adicionar/remover notas · 1 passo = 1 colcheia</span>
      </div>

      <div className="flex justify-end gap-1 pt-1 border-t border-zinc-800">
        <button onClick={onCancel}
          className="px-3 py-1 text-xs rounded"
          style={{ background: "#333", color: "#999" }}
        >
          Cancelar
        </button>
        <button onClick={handleConfirm}
          className="px-3 py-1 text-xs rounded font-medium"
          style={{ background: "#0066FF", color: "#fff" }}
        >
          Inserir na sintaxe
        </button>
      </div>
    </div>
  );
}
