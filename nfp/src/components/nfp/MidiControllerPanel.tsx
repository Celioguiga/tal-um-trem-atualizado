import { useState, useRef, useCallback, useEffect } from "react";
import {
  MidiRecorder, midiNotesToCromus,
  type MidiNote, type MidiDeviceInfo,
} from "../../lib/midiRecorder";

type Props = {
  onInsert: (cromus: string) => void;
  vars: Record<string, string>;
  volume: number;
  onVolumeChange: (v: number) => void;
};

const NOTE_NAMES: Record<number, string> = {
  1: "Dó", 2: "Ré", 3: "Mi", 4: "Fá",
  5: "Sol", 6: "Lá", 7: "Si",
};

export function MidiControllerPanel({ onInsert, vars, volume, onVolumeChange }: Props) {
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [currentNote, setCurrentNote] = useState<{
    degree: number; octave: number; velocity: number; midiNote: number;
  } | null>(null);
  const [noteCount, setNoteCount] = useState(0);
  const [octaveShift, setOctaveShift] = useState(0);
  const [lastNotes, setLastNotes] = useState<MidiNote[]>([]);
  const midiRef = useRef<MidiRecorder | null>(null);
  const octaveShiftRef = useRef(0);
  const recordingRef = useRef(false);

  const refreshDevices = useCallback(() => {
    if (midiRef.current) {
      const d = midiRef.current.getDevices();
      setDevices(d);
      if (!selectedDeviceId && d.length > 0) setSelectedDeviceId(d[0].id);
    }
  }, [selectedDeviceId]);

  const handleToggleConnect = useCallback(async () => {
    if (connected) {
      if (recordingRef.current) {
        const notes = midiRef.current?.stop() || [];
        setLastNotes(notes);
        recordingRef.current = false;
        setRecording(false);
      }
      setConnected(false);
      setCurrentNote(null);
      midiRef.current = null;
      return;
    }

    const recorder = new MidiRecorder({
      onNoteOn: (note) => {
        setCurrentNote({
          degree: note.degree,
          octave: note.octave + octaveShiftRef.current,
          velocity: note.velocity,
          midiNote: note.midiNote,
        });
        if (recordingRef.current) setNoteCount((c) => c + 1);
      },
      onNoteOff: () => {
        setCurrentNote(null);
      },
      onDeviceChange: (d) => {
        setDevices(d);
        if (d.length > 0) setSelectedDeviceId(d[0].id);
      },
      onError: (err) => {
        alert(err);
        setConnected(false);
        setRecording(false);
      },
    });
    recorder.recordedNotes = [];

    const ok = await recorder.start();
    if (ok) {
      midiRef.current = recorder;
      setConnected(true);
      setDevices(recorder.getDevices());
      setNoteCount(0);
      setLastNotes([]);
    }
  }, [connected, recording]);

  const handleStartRecording = useCallback(() => {
    if (!midiRef.current) return;
    midiRef.current.recordedNotes = [];
    setNoteCount(0);
    recordingRef.current = true;
    setRecording(true);
  }, []);

  const handleStopRecording = useCallback(() => {
    if (!midiRef.current) return;
    const notes = midiRef.current.stop();
    setLastNotes(notes);
    recordingRef.current = false;
    setRecording(false);
  }, []);

  const handleDiscard = useCallback(() => {
    setLastNotes([]);
    setNoteCount(0);
    if (midiRef.current) {
      midiRef.current.recordedNotes = [];
    }
    recordingRef.current = false;
    setRecording(false);
  }, []);

  const handleInsert = useCallback(() => {
    if (lastNotes.length === 0) return;
    const cromus = midiNotesToCromus(lastNotes);
    onInsert(cromus);
    setLastNotes([]);
    setNoteCount(0);
  }, [lastNotes, onInsert]);

  const shiftOctave = useCallback((delta: number) => {
    setOctaveShift((prev) => {
      const next = prev + delta;
      octaveShiftRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;
    if (!connected) return;
    const id = setInterval(refreshDevices, 2000);
    return () => clearInterval(id);
  }, [connected, refreshDevices]);

  useEffect(() => {
    return () => {
      midiRef.current?.stop();
      midiRef.current = null;
    };
  }, []);

  const currentDevice = devices.find((d) => d.id === selectedDeviceId);

  return (
    <div className="flex flex-col" style={{
      background: vars["--surface"],
      borderBottom: `1px solid ${vars["--border"]}`,
      fontSize: 11,
    }}>
      {/* ── Cabeçalho ── */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span style={{ color: vars["--textMuted"], fontWeight: 600, letterSpacing: "0.04em", fontSize: 10 }}>
          MIDI CONTROLLER
        </span>

        {/* Conexão */}
        <button onClick={handleToggleConnect}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium"
          style={{
            background: connected ? "#C0001A15" : "#00B05015",
            color: connected ? "#C0001A" : "#00B050",
            border: `1px solid ${connected ? "#C0001A40" : "#00B05040"}`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{
              background: connected ? "#C0001A" : "#00B050",
              boxShadow: connected ? "0 0 4px #C0001A" : "0 0 4px #00B050",
            }}
          />
          {connected ? "Desconectar" : "Conectar"}
        </button>

        {/* Dispositivo atual */}
        {connected && devices.length > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px]"
            style={{ background: "#ffffff08", border: `1px solid ${vars["--border"]}` }}
          >
            <span style={{ color: vars["--textMuted"] }}>🎹</span>
            <span style={{ color: vars["--text"] }}>
              {currentDevice?.name || devices[0]?.name || "Conectado"}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: vars["--textMuted"] }}>🔊</span>
          <input type="range" min="0" max="100" value={Math.round(volume * 100)}
            onChange={(e) => onVolumeChange(parseInt(e.target.value) / 100)}
            className="w-16 h-1 rounded-full cursor-pointer"
            style={{
              accentColor: vars["--accent"],
              background: vars["--surface2"],
            }}
          />
          <span className="text-[10px] font-mono w-6 text-right"
            style={{ color: vars["--text"] }}
          >{Math.round(volume * 100)}%</span>
        </div>

        {/* Octave Shift */}
        {connected && (
          <div className="flex items-center gap-0.5">
            <button onClick={() => shiftOctave(-1)}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: vars["--surface2"], color: vars["--textDim"] }}
            >-8va</button>
            <span className="text-[10px] font-mono px-1"
              style={{
                color: octaveShift !== 0 ? vars["--accent"] : vars["--textMuted"],
                fontWeight: octaveShift !== 0 ? 600 : 400,
              }}
            >
              {octaveShift > 0 ? `+${octaveShift}` : octaveShift === 0 ? "±0" : String(octaveShift)}
            </span>
            <button onClick={() => shiftOctave(1)}
              className="px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ background: vars["--surface2"], color: vars["--textDim"] }}
            >+8va</button>
          </div>
        )}
      </div>

      {/* ── Painel de status ── */}
      {connected && (
        <div className="flex items-center gap-3 px-3 pb-2">
          {/* Indicador de nota atual */}
          <div className="flex items-center gap-2 px-2 py-1 rounded flex-1"
            style={{ background: vars["--bg"] }}
          >
            <div className="w-2 h-2 rounded-full shrink-0"
              style={{
                background: currentNote ? "#00B050" : "#333",
                boxShadow: currentNote ? "0 0 6px #00B050" : "none",
                transition: "all 0.05s",
              }}
            />
            <span className="text-[11px] font-mono" style={{ color: vars["--text"] }}>
              {currentNote
                ? `${NOTE_NAMES[currentNote.degree] || "?"}${currentNote.degree} · oitava ${currentNote.octave} · v${currentNote.velocity}`
                : "Aguardando nota..."
              }
            </span>
          </div>

          {/* Controle de gravação */}
          <div className="flex items-center gap-1">
            {recording ? (
              <>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "#C0001A" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C0001A] animate-pulse" />
                  Gravando ({noteCount})
                </span>
                <button onClick={handleStopRecording}
                  className="px-2 py-0.5 text-[10px] font-bold rounded"
                  style={{ background: "#C0001A", color: "#fff" }}
                >⏹</button>
              </>
            ) : (
              <button onClick={handleStartRecording} disabled={!connected}
                className="px-2 py-0.5 text-[10px] font-bold rounded flex items-center gap-1"
                style={{
                  background: vars["--accent"],
                  color: "#fff",
                  opacity: !connected ? 0.3 : 1,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Gravar
              </button>
            )}
          </div>

          {/* Última gravação */}
          {lastNotes.length > 0 && !recording && (
            <div className="flex items-center gap-1">
              <span className="text-[10px]" style={{ color: vars["--textMuted"] }}>
                {lastNotes.length} notas
              </span>
              <button onClick={handleDiscard}
                className="px-1.5 py-0.5 text-[10px] rounded"
                style={{ background: "#333", color: "#999" }}
              >Descartar</button>
              <button onClick={handleInsert}
                className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                style={{ background: vars["--accent"], color: "#fff" }}
              >Inserir</button>
            </div>
          )}

          {/* Refresh devices */}
          <button onClick={refreshDevices}
            className="px-1.5 py-0.5 text-[10px] rounded"
            style={{ background: vars["--surface2"], color: vars["--textDim"] }}
          >↻</button>
        </div>
      )}

      {/* ── Mensagem inicial ── */}
      {!connected && (
        <div className="px-3 pb-2">
          <p className="text-[10px]" style={{ color: vars["--textMuted"] }}>
            Conecte seu controlador MIDI (Oxygen 61, etc.) via USB e clique em "Conectar".
            Use Chrome ou Edge para suporte MIDI.
          </p>
        </div>
      )}
    </div>
  );
}
