import { notesToCromus, freqToDegree } from "./src/lib/pitchDetection";
import { midiNotesToCromus } from "./src/lib/midiRecorder";
import type { DetectedNote } from "./src/lib/pitchDetection";
import type { MidiNote } from "./src/lib/midiRecorder";

function freqToNoteName(freq: number): string {
  if (freq <= 0) return "---";
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const midi = Math.round(12 * (Math.log2(freq / 440)) + 69);
  const octave = Math.floor(midi / 12) - 1;
  return names[midi % 12] + octave;
}

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log(`  ✅ ${msg}`); }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

console.log("=== TESTE 1: freqToDegree ===");
assert(freqToDegree(261.63) === 1, "Do 261.63 Hz = grau 1");
assert(freqToDegree(293.66) === 2, "Re 293.66 Hz = grau 2");
assert(freqToDegree(329.63) === 3, "Mi 329.63 Hz = grau 3");
assert(freqToDegree(349.23) === 4, "Fa 349.23 Hz = grau 4");
assert(freqToDegree(392.00) === 5, "Sol 392 Hz = grau 5");
assert(freqToDegree(440.00) === 6, "La 440 Hz = grau 6");
assert(freqToDegree(493.88) === 7, "Si 493.88 Hz = grau 7");
assert(freqToDegree(523.25) === 1, "Do 523.25 Hz (oitava acima) = grau 1");
assert(freqToDegree(0) === 0, "Silencio = grau 0");

console.log("\n=== TESTE 2: notesToCromus ===");
const mockNotes: DetectedNote[] = [
  { degree: 1, octave: 4, freq: 261.63, startTime: 0, endTime: 500, cents: 0 },
  { degree: 2, octave: 4, freq: 293.66, startTime: 500, endTime: 1000, cents: 0 },
  { degree: 3, octave: 4, freq: 329.63, startTime: 1000, endTime: 1500, cents: 0 },
  { degree: 4, octave: 4, freq: 349.23, startTime: 1500, endTime: 2000, cents: 0 },
  { degree: 5, octave: 4, freq: 392.00, startTime: 2000, endTime: 2500, cents: 0 },
  { degree: 6, octave: 4, freq: 440.00, startTime: 2500, endTime: 3000, cents: 0 },
  { degree: 7, octave: 4, freq: 493.88, startTime: 3000, endTime: 3500, cents: 0 },
  { degree: 1, octave: 5, freq: 523.25, startTime: 3500, endTime: 4000, cents: 0 },
];
const cromus = notesToCromus(mockNotes);
assert(cromus.includes("7"), "Contem Si (grau 7)");
assert(cromus.includes("1'"), "Contem Do oitava acima");

console.log("\n=== TESTE 3: midiNotesToCromus ===");
const midiNotes: MidiNote[] = [
  { degree: 1, octave: 4, velocity: 100, startTime: 0, endTime: 500, midiNote: 60 },
  { degree: 3, octave: 4, velocity: 90, startTime: 500, endTime: 1000, midiNote: 64 },
  { degree: 5, octave: 4, velocity: 80, startTime: 1000, endTime: 1500, midiNote: 67 },
];
const midiCromus = midiNotesToCromus(midiNotes);
assert(midiCromus.includes("1"), "Contem Do");
assert(midiCromus.includes("3"), "Contem Mi");
assert(midiCromus.includes("5"), "Contem Sol");

console.log("\n=== TESTE 4: Frequencias conhecidas (12-TET) ===");
const testFreqs = [
  { freq: 261.63, name: "C4" },
  { freq: 277.18, name: "C#4" },
  { freq: 293.66, name: "D4" },
  { freq: 311.13, name: "D#4" },
  { freq: 329.63, name: "E4" },
  { freq: 349.23, name: "F4" },
  { freq: 369.99, name: "F#4" },
  { freq: 392.00, name: "G4" },
  { freq: 415.30, name: "G#4" },
  { freq: 440.00, name: "A4" },
  { freq: 466.16, name: "A#4" },
  { freq: 493.88, name: "B4" },
];
for (const t of testFreqs) {
  const detected = freqToNoteName(t.freq);
  assert(detected === t.name, `${t.freq} Hz → ${detected}`);
}

console.log(`\n========================================`);
console.log(`  RESULTADO: ${pass}/${pass+fail} passaram (${fail} falhas)`);
if (fail > 0) process.exit(1);
