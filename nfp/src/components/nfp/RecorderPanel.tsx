import { useState, useRef, useCallback, useEffect } from "react";
import { MelodyRecorder, notesToCromus, type DetectedNote } from "../../lib/pitchDetection";
import { MidiRecorder, midiNotesToCromus, type MidiNote } from "../../lib/midiRecorder";
import { StepRecorder } from "./StepRecorder";
import { LiveSynth, midiToFreq } from "../../lib/liveSynth";
import { INSTRUMENTS } from "../../lib/instruments";

type Tab = "microfone" | "midi" | "step";

type Props = {
  onInsert: (cromus: string) => void;
  onClose: () => void;
  vars: Record<string, string>;
};

function formatFreq(freq: number): string {
  if (freq <= 0) return "---";
  return `${freq.toFixed(1)} Hz`;
}

export function RecorderPanel({ onInsert, onClose, vars }: Props) {
  const [tab, setTab] = useState<Tab>("microfone");

  /* Live synth — tocar notas em tempo real */
  const synthRef = useRef<LiveSynth | null>(null);
  const [instrumentId, setInstrumentId] = useState("piano");
  const [sfStatus, setSfStatus] = useState("idle");
  const getSynth = useCallback(() => {
    if (!synthRef.current) synthRef.current = new LiveSynth();
    synthRef.current.setInstrument(instrumentId);
    synthRef.current.onStatus(setSfStatus);
    return synthRef.current;
  }, [instrumentId]);

  /* Microfone state */
  const [micRecording, setMicRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState({ freq: 0, degree: 0, name: "" });
  const [micCount, setMicCount] = useState(0);
  const [micMonitor, setMicMonitor] = useState(true);
  const recorderRef = useRef<MelodyRecorder | null>(null);

  /* MIDI state */
  const [midiRecording, setMidiRecording] = useState(false);
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [midiCount, setMidiCount] = useState(0);
  const [midiSupported, setMidiSupported] = useState(true);
  const midiRef = useRef<MidiRecorder | null>(null);

  /* Step state */
  const [showStep, setShowStep] = useState(false);
  const lastMicNotes = useRef<DetectedNote[]>([]);
  const lastMidiNotes = useRef<MidiNote[]>([]);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    /* Pre-carrega o piano ao abrir o painel */
    const s = getSynth();
    s.preload();
    return () => {
      recorderRef.current?.stop();
      midiRef.current?.stop();
      synthRef.current?.dispose();
    };
  }, []);

  /* ── Microfone ── */
  const toggleMic = useCallback(async () => {
    if (micRecording) {
      const notes = recorderRef.current?.stop() || [];
      lastMicNotes.current = notes;
      setMicRecording(false);
      synthRef.current?.dispose();
      synthRef.current = null;
      return;
    }

    const synth = getSynth();
    let lastNoteId = 0;

    const recorder = new MelodyRecorder({
      onPitch: (freq, degree, name) => {
        setCurrentPitch({ freq, degree, name });
      },
      onNoteOn: (note) => {
        setMicCount((c) => c + 1);
        if (micMonitor && note.freq > 0) {
          synth.noteOn(++lastNoteId, note.freq, 0.6);
          setTimeout(() => synth.noteOff(lastNoteId), 400);
        }
      },
      onError: (err) => {
        alert(err);
        setMicRecording(false);
      },
    });

    try {
      await recorder.start();
      recorderRef.current = recorder;
      setMicRecording(true);
      setCurrentPitch({ freq: 0, degree: 0, name: "" });
      setMicCount(0);
    } catch {
      /* Erro já tratado pelo callback onError */
    }
  }, [micRecording, micMonitor, getSynth]);

  const confirmMic = useCallback(() => {
    const notes = recorderRef.current?.stop() || lastMicNotes.current;
    if (notes.length > 0) {
      onInsert(notesToCromus(notes));
    }
    setMicRecording(false);
  }, [onInsert]);

  /* ── MIDI ── */
  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      setMidiSupported(false);
    }
  }, []);

  const toggleMidi = useCallback(async () => {
    if (midiRecording) {
      const notes = midiRef.current?.stop() || [];
      lastMidiNotes.current = notes;
      setMidiRecording(false);
      synthRef.current?.dispose();
      synthRef.current = null;
      return;
    }

    const synth = getSynth();

    const recorder = new MidiRecorder({
      onNoteOn: (note) => {
        setMidiCount((c) => c + 1);
        synth.noteOn(note.midiNote, midiToFreq(note.midiNote), note.velocity / 127);
      },
      onNoteOff: (note) => {
        synth.noteOff(note.midiNote);
      },
      onDeviceChange: (devices) => {
        setMidiDevices(devices.filter((d) => d.connected).map((d) => d.name));
      },
      onError: (err) => {
        alert(err);
        setMidiRecording(false);
      },
    });

    const ok = await recorder.start();
    if (ok) {
      midiRef.current = recorder;
      setMidiRecording(true);
      setMidiCount(0);
      setMidiDevices(recorder.getDevices().map((d) => d.name));
    }
  }, [midiRecording, getSynth]);

  const confirmMidi = useCallback(() => {
    const notes = midiRef.current?.stop() || lastMidiNotes.current;
    if (notes.length > 0) {
      onInsert(midiNotesToCromus(notes));
    }
    setMidiRecording(false);
  }, [onInsert]);

  /* ── Step ── */
  const handleStepConfirm = useCallback((cromus: string) => {
    setShowStep(false);
    if (cromus.trim()) {
      onInsert(cromus);
    }
  }, [onInsert]);

  const handleStepCancel = useCallback(() => {
    setShowStep(false);
  }, []);

  return (
    <div className="flex flex-col" style={{
      background: vars["--surface"],
      borderBottom: `1px solid ${vars["--border"]}`,
    }}>
      {/* ── Tabs ── */}
      <div className="flex items-center border-b" style={{ borderColor: vars["--border"] }}>
        {([
          ["microfone", "🎤 Microfone"],
          ["midi", "🎹 MIDI"],
          ["step", "✎ Step"],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setShowStep(false); }}
            className="px-3 py-1.5 text-[11px] font-medium transition-colors"
            style={{
              color: tab === key ? vars["--accent"] : vars["--textDim"],
              borderBottom: tab === key ? `2px solid ${vars["--accent"]}` : "2px solid transparent",
            }}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 mr-1">
          <select
            value={instrumentId}
            onChange={(e) => {
              setInstrumentId(e.target.value);
              const s = getSynth();
              s.setInstrument(e.target.value);
              s.preload();
            }}
            className="px-1.5 py-0.5 text-[10px] rounded border"
            style={{
              background: vars["--bg"],
              color: vars["--text"],
              borderColor: vars["--border"],
            }}
          >
            {INSTRUMENTS.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.icon} {inst.nome}
              </option>
            ))}
          </select>
          {sfStatus === "loading" && (
            <span className="text-[9px]" style={{ color: vars["--textDim"] }}>⏳</span>
          )}
          {sfStatus === "ready" && (
            <span className="text-[9px]" style={{ color: "#00B050" }}>●</span>
          )}
          {sfStatus === "error" && (
            <span className="text-[9px]" style={{ color: "#C0001A" }}>⚠</span>
          )}
        </div>
        <button onClick={() => { getSynth().pluck(440, 0.5); }} className="px-2 text-xs" style={{ color: vars["--accent"] }}>
          🔊
        </button>
        <button onClick={onClose} className="px-2 text-xs" style={{ color: vars["--textDim"] }}>
          ✕
        </button>
      </div>

      {/* ── Microfone Tab ── */}
      {tab === "microfone" && (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-3">
            <button onClick={toggleMic}
              className="px-3 py-1.5 text-xs font-bold rounded transition-all"
              style={{
                background: micRecording ? "#C0001A" : vars["--accent"],
                color: "#fff",
              }}
            >
              {micRecording ? "⏹ Parar" : "🎤 Gravar"}
            </button>
            <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: vars["--textDim"] }}>
              <input type="checkbox" checked={micMonitor} onChange={(e) => setMicMonitor(e.target.checked)} />
              🔊 Monitorar
            </label>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: vars["--textDim"] }}>
                Notas: <strong style={{ color: vars["--text"] }}>{micCount}</strong>
              </span>
              {currentPitch.freq > 0 && (
                <span style={{ color: currentPitch.degree > 0 ? vars["--accent"] : vars["--textDim"] }}>
                  {currentPitch.name} · {formatFreq(currentPitch.freq)}
                </span>
              )}
            </div>
          </div>

          <div className="h-12 rounded flex items-center justify-center"
            style={{ background: vars["--bg"] }}
          >
            {micRecording ? (
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#C0001A] animate-pulse" />
                <span className="text-xs" style={{ color: vars["--textMuted"] }}>
                  {currentPitch.freq > 0
                    ? `Detectado: ${currentPitch.name} (grau ${currentPitch.degree})`
                    : "Aguardando som..."}
                </span>
              </div>
            ) : (
              <span className="text-xs" style={{ color: vars["--textMuted"] }}>
                {lastMicNotes.current.length > 0
                  ? `${lastMicNotes.current.length} notas detectadas`
                  : "Cante ou toque uma melodia"}
              </span>
            )}
          </div>

          {!micRecording && lastMicNotes.current.length > 0 && (
            <div className="flex justify-end gap-1">
              <button onClick={() => { lastMicNotes.current = []; setMicCount(0); }}
                className="px-2 py-0.5 text-[10px] rounded" style={{ background: "#333", color: "#999" }}
              >
                Descartar
              </button>
              <button onClick={confirmMic}
                className="px-2 py-0.5 text-[10px] rounded font-medium"
                style={{ background: vars["--accent"], color: "#fff" }}
              >
                Inserir na sintaxe
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── MIDI Tab ── */}
      {tab === "midi" && (
        <div className="p-3 space-y-2">
          {!midiSupported ? (
            <p className="text-xs" style={{ color: "#C0001A" }}>
              MIDI não suportado neste navegador. Use Chrome ou Edge.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button onClick={toggleMidi}
                  className="px-3 py-1.5 text-xs font-bold rounded transition-all"
                  style={{
                    background: midiRecording ? "#C0001A" : vars["--accent"],
                    color: "#fff",
                  }}
                >
                  {midiRecording ? "⏹ Parar" : "🎹 Conectar"}
                </button>
                <span className="text-xs" style={{ color: vars["--textDim"] }}>
                  Notas: <strong style={{ color: vars["--text"] }}>{midiCount}</strong>
                </span>
              </div>

              {midiDevices.length > 0 && (
                <div className="text-[10px]" style={{ color: vars["--textMuted"] }}>
                  Dispositivos: {midiDevices.join(", ")}
                </div>
              )}

              <div className="h-12 rounded flex items-center justify-center"
                style={{ background: vars["--bg"] }}
              >
                <span className="text-xs" style={{ color: vars["--textMuted"] }}>
                  {midiRecording
                    ? "Conectado — toque no teclado MIDI"
                    : lastMidiNotes.current.length > 0
                      ? `${lastMidiNotes.current.length} notas gravadas`
                      : "Conecte um teclado MIDI USB"}
                </span>
              </div>

              {!midiRecording && lastMidiNotes.current.length > 0 && (
                <div className="flex justify-end gap-1">
                  <button onClick={() => { lastMidiNotes.current = []; setMidiCount(0); }}
                    className="px-2 py-0.5 text-[10px] rounded" style={{ background: "#333", color: "#999" }}
                  >
                    Descartar
                  </button>
                  <button onClick={confirmMidi}
                    className="px-2 py-0.5 text-[10px] rounded font-medium"
                    style={{ background: vars["--accent"], color: "#fff" }}
                  >
                    Inserir na sintaxe
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Step Tab ── */}
      {tab === "step" && (
        !showStep ? (
          <div className="p-3 space-y-2">
            <p className="text-xs" style={{ color: vars["--textMuted"] }}>
              Clique em uma grade de 16 passos para compor sua melodia visualmente.
            </p>
            <button onClick={() => setShowStep(true)}
              className="px-3 py-1.5 text-xs font-bold rounded"
              style={{ background: vars["--accent"], color: "#fff" }}
            >
              ✎ Abrir Step Sequencer
            </button>
          </div>
        ) : (
          <StepRecorder onConfirm={handleStepConfirm} onCancel={handleStepCancel} />
        )
      )}
    </div>
  );
}
