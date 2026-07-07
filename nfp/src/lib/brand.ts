export const SYMUSIC = {
  name: "Synemusic",
  tagline: "A música que se vê.",
  concept: "A senoide mais pura da física do som. A marca não é uma das sete formas-grau: é a onda que as carrega todas. Som puro atravessado pelas sete cores.",
  url: "https://synemusic.com.br",
  version: "v0.1.0",
} as const;

export const BRAND = {
  name: "Note Form Pro",
  tagline: "Real Nota Forma Grau",
  ecosystem: SYMUSIC.name,
  motherTagline: SYMUSIC.tagline,
} as const;

export const RNFG = {
  do:   { hex: "#C0001A", nome: "Dó",   grau: "I",   forma: "Círculo",   rainha: "Rainha Fada do Fogo" },
  re:   { hex: "#ECD200", nome: "Ré",   grau: "II",  forma: "Ogiva",     rainha: "Rainha Fada da Luz" },
  mi:   { hex: "#F07300", nome: "Mi",   grau: "III", forma: "Triângulo", rainha: "Rainha Fada da Chama" },
  fa:   { hex: "#00B050", nome: "Fá",   grau: "IV",  forma: "Quadrado",  rainha: "Rainha Fada da Floresta" },
  sol:  { hex: "#0066FF", nome: "Sol",  grau: "V",   forma: "Estrela",  rainha: "Rainha Fada do Céu" },
  la:   { hex: "#8B5E00", nome: "Lá",   grau: "VI",  forma: "Hexágono",  rainha: "Rainha Fada da Terra" },
  si:   { hex: "#9B5FC0", nome: "Si",   grau: "VII", forma: "Casinha",  rainha: "Rainha Fada do Sonho" },
} as const;

export const RNFG_ARRAY = Object.values(RNFG);

export const BRAND_COLORS = {
  gold:      "#E8A820",
  goldGlow:  "#E8A82020",
  primary:   "#0066FF",
  accent:    "#9B5FC0",
  success:   "#00B050",
  warning:   "#F07300",
  error:     "#C0001A",
  ink:       "#141009",
  inkRaise:  "#1A1610",
  inkLine:   "#2A241A",
  ivory:     "#F5F2EA",
  parch:     "#A69B85",
  parchDim:  "#6F664F",
  surface:   "#1A1610",
  surface2:  "#251F17",
  border:    "#2A241A",
  text:      "#F5F2EA",
  textDim:   "#A69B85",
  textMuted: "#6F664F",
  bg:        "#141009",
} as const;

export const TYPOGRAPHY = {
  fontFamily:  "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontMono:    "'JetBrains Mono', monospace",
  weights:     { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 },
} as const;

export const BRAND_GRADIENT = `linear-gradient(135deg,
  ${RNFG.do.hex}, ${RNFG.mi.hex}, ${RNFG.re.hex},
  ${RNFG.fa.hex}, ${RNFG.sol.hex}, ${RNFG.la.hex}, ${RNFG.si.hex})`;

export const WAVE_PATH = "M 20 60 C 31.11 42.2 42.22 26 53.33 26 C 64.44 26 75.56 42.2 86.67 60 C 97.78 77.8 108.89 94 120 94 C 131.11 94 142.22 77.8 153.33 60 C 164.44 42.2 175.56 26 186.67 26 C 197.78 26 208.89 42.2 220 60";

export const WAVE_NODES = [
  { x: 20,    y: 60,  c: RNFG.do.hex },
  { x: 53.33, y: 26,  c: RNFG.re.hex },
  { x: 86.67, y: 60,  c: RNFG.mi.hex },
  { x: 120,   y: 94,  c: RNFG.fa.hex },
  { x: 153.33,y: 60,  c: RNFG.sol.hex },
  { x: 186.67,y: 26,  c: RNFG.la.hex },
  { x: 220,   y: 60,  c: RNFG.si.hex },
];

export const ARCHITECTURE: Record<string, { cor: string; desc: string }> = {
  "RNFG":         { cor: RNFG.do.hex,  desc: "O núcleo. A escrita musical de cor, forma e grau." },
  "Krisícho":     { cor: RNFG.si.hex,  desc: "Narrativa transmídia — Rainhas Fadas e Reis Duendes." },
  "Maestro":      { cor: RNFG.sol.hex, desc: "Tutor socrático e gestor estratégico do sistema." },
  "Pro / NFP":    { cor: RNFG.mi.hex,  desc: "O motor Cromus que converte sintaxe em partitura RNFG." },
  "Real Tablatura":{ cor: RNFG.fa.hex, desc: "Extensão da metodologia para violão e cordas." },
  "Acervo GRAU":  { cor: RNFG.la.hex,  desc: "Catálogo de cantigas e obras para a prática." },
};

export const SHAPE_CLIP = {
  circulo:  "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  ogiva:    "polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)",
  triangulo:"polygon(50% 0%, 100% 100%, 0% 100%)",
  quadrado: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  estrela:  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  hexagono: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
  casinha:  "polygon(50% 0%, 100% 50%, 100% 100%, 0% 100%, 0% 50%)",
} as const;

export const SHAPE_PATHS = {
  circulo:  "M12,0A12,12 0 1,0 12,24A12,12 0 1,0 12,0Z",
  ogiva:    "M10,50 Q50,14 90,50 Q50,86 10,50 Z",
  triangulo:"M50,13 L84,73 L16,73 Z",
  quadrado: "M17,17 L83,17 L83,83 L17,83 Z",
  estrela:  "M50,10 L59.4,37.06 L88.04,37.64 L65.22,54.94 L73.51,82.36 L50,66 L26.49,82.36 L34.78,54.94 L11.96,37.64 L40.6,37.06 Z",
  hexagono: "M10,50 L30,25 L70,25 L90,50 L70,75 L30,75 Z",
  casinha:  "M50,16 L82,48 L73,48 L73,84 L27,84 L27,48 L18,48 Z",
} as const;
