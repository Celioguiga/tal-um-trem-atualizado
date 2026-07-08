/* ── Transposicao de sintaxe CROMUS + tonalidade ── */

type ParsedToken = {
  isDegree: boolean;
  leadingApos: number;
  degree: number;
  trailingApos: number;
  accidental: string;
  duration: string;
};

function parseToken(token: string): ParsedToken | null {
  if (!/^['1-7]/.test(token)) return null;

  let pos = 0;
  let leadingApos = 0;
  let trailingApos = 0;
  let degree = 0;
  let accidental = "";
  let duration = "";

  while (pos < token.length && token[pos] === "'") {
    leadingApos++;
    pos++;
  }

  if (pos < token.length && /[1-7]/.test(token[pos])) {
    degree = parseInt(token[pos]);
    pos++;
  } else {
    return null;
  }

  while (pos < token.length) {
    const ch = token[pos];
    if (ch === "'") trailingApos++;
    else if (ch === "#" || ch === "b") accidental += ch;
    else if (ch === "*") duration += ch;
    else break;
    pos++;
  }

  if (pos < token.length) return null;

  return { isDegree: true, leadingApos, degree, trailingApos, accidental, duration };
}

function reassemble(degree: number, octaveOffset: number, accidental: string, duration: string): string {
  let result = "";
  if (octaveOffset < 0) {
    result += "'".repeat(-octaveOffset);
  }
  result += degree;
  if (octaveOffset > 0) {
    result += "'".repeat(octaveOffset);
  }
  result += accidental;
  result += duration;
  return result;
}

export function transposeCromus(sintaxe: string, shift: number): string {
  if (shift === 0) return sintaxe;

  return sintaxe.split(/(\s+)/).map((part) => {
    if (/^\s+$/.test(part)) return part;
    if (part === "") return part;

    const parsed = parseToken(part);
    if (!parsed) return part;

    let newDegree = parsed.degree + shift;
    let octaveOffset = parsed.trailingApos - parsed.leadingApos;

    while (newDegree > 7) {
      newDegree -= 7;
      octaveOffset++;
    }
    while (newDegree < 1) {
      newDegree += 7;
      octaveOffset--;
    }

    return reassemble(newDegree, octaveOffset, parsed.accidental, parsed.duration);
  }).join("");
}

export const TRANSPOSE_INTERVALS = [
  { label: "+1 (2ª)", value: 1 },
  { label: "+2 (3ª)", value: 2 },
  { label: "+3 (4ª)", value: 3 },
  { label: "+4 (5ª)", value: 4 },
  { label: "+5 (6ª)", value: 5 },
  { label: "+6 (7ª)", value: 6 },
  { label: "+7 (8va)", value: 7 },
  { label: "−1 (2ª)", value: -1 },
  { label: "−2 (3ª)", value: -2 },
  { label: "−3 (4ª)", value: -3 },
  { label: "−4 (5ª)", value: -4 },
  { label: "−5 (6ª)", value: -5 },
  { label: "−6 (7ª)", value: -6 },
  { label: "−7 (8va)", value: -7 },
];

/* ── Mapeamento de tonalidade ── */

/* Semitons por grau da escala maior: 1→2=+2, 2→3=+2, 3→4=+1, 4→5=+2, 5→6=+2, 6→7=+2, 7→1=+1 */
const DEGREE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

function degreeShiftToSemitones(shift: number): number {
  const normalized = ((shift % 7) + 7) % 7;
  return DEGREE_SEMITONES[normalized];
}

/* Indice cromatico (0-11) para cada valor de tonalidade do LilyPond */
const KEY_CHROMATIC: Record<string, number> = {
  "c \\major": 0, "c \\minor": 0,
  "cis \\major": 1, "cis \\minor": 1,
  "d \\major": 2, "d \\minor": 2,
  "dis \\major": 3, "dis \\minor": 3,
  "ees \\minor": 3,
  "e \\major": 4, "e \\minor": 4,
  "f \\major": 5, "f \\minor": 5,
  "fis \\major": 6, "fis \\minor": 6,
  "ges \\major": 6,
  "g \\major": 7, "g \\minor": 7,
  "gis \\minor": 8,
  "aes \\major": 8, "aes \\minor": 8,
  "a \\major": 9, "a \\minor": 9,
  "ais \\minor": 10,
  "bes \\major": 10, "bes \\minor": 10,
  "b \\major": 11, "b \\minor": 11,
  "ces \\major": 11,
  "des \\major": 1,
};

/* Mapa reverso: indice cromatico -> valor de tonalidade (preferindo sustenidos para +, bemóis para -) */
const CHROMATIC_TO_KEY_SHARP: Record<number, string> = {
  0: "c \\major", 1: "cis \\major", 2: "d \\major", 3: "dis \\major",
  4: "e \\major", 5: "f \\major", 6: "fis \\major", 7: "g \\major",
  8: "gis \\major", 9: "a \\major", 10: "ais \\major", 11: "b \\major",
};

const CHROMATIC_TO_KEY_FLAT: Record<number, string> = {
  0: "c \\major", 1: "des \\major", 2: "d \\major", 3: "ees \\major",
  4: "e \\major", 5: "f \\major", 6: "ges \\major", 7: "g \\major",
  8: "aes \\major", 9: "a \\major", 10: "bes \\major", 11: "ces \\major",
};

const CHROMATIC_TO_MINOR_SHARP: Record<number, string> = {
  0: "a \\minor", 1: "ais \\minor", 2: "b \\minor", 3: "cis \\minor",
  4: "c \\minor", 5: "d \\minor", 6: "dis \\minor", 7: "e \\minor",
  8: "f \\minor", 9: "fis \\minor", 10: "g \\minor", 11: "gis \\minor",
};

const CHROMATIC_TO_MINOR_FLAT: Record<number, string> = {
  0: "a \\minor", 1: "bes \\minor", 2: "b \\minor", 3: "c \\minor",
  4: "c \\minor", 5: "d \\minor", 6: "ees \\minor", 7: "e \\minor",
  8: "f \\minor", 9: "fis \\minor", 10: "g \\minor", 11: "aes \\minor",
};

export function transposeKey(tonalidade: string, shift: number): string {
  if (shift === 0) return tonalidade;

  const chromatic = KEY_CHROMATIC[tonalidade];
  if (chromatic === undefined) return tonalidade;

  const semitones = degreeShiftToSemitones(shift);
  const isMinor = tonalidade.includes("\\minor");
  const useFlats = shift < 0;

  let newChromatic = (chromatic + semitones + 12) % 12;
  /* Para shift de 7 (oitava), soma 12 semitons mas mod 12 = mesma nota */
  if (Math.abs(shift) === 7) {
    /* Oitava = mesma tonalidade */
    return tonalidade;
  }

  if (isMinor) {
    return useFlats ? CHROMATIC_TO_MINOR_FLAT[newChromatic] : CHROMATIC_TO_MINOR_SHARP[newChromatic];
  } else {
    return useFlats ? CHROMATIC_TO_KEY_FLAT[newChromatic] : CHROMATIC_TO_KEY_SHARP[newChromatic];
  }
}

