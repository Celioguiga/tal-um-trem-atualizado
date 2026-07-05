/* ── Note Form Pro — Identidade Visual ── */

export const BRAND = {
  name: "Note Form Pro",
  tagline: "Real Nota Forma Grau",
  ecosystem: "Synemusic",
  url: "https://synemusic.com.br",
} as const;

/* ── Paleta RNFG (cores absolutas das notas) ── */
export const RNFG = {
  do:   { hex: "#C0001A", nome: "Dó",   grau: "I",   forma: "Círculo" },
  re:   { hex: "#ECD200", nome: "Ré",   grau: "II",  forma: "Ogiva" },
  mi:   { hex: "#F07300", nome: "Mi",   grau: "III", forma: "Triângulo" },
  fa:   { hex: "#00B050", nome: "Fá",   grau: "IV",  forma: "Quadrado" },
  sol:  { hex: "#0066FF", nome: "Sol",  grau: "V",   forma: "Estrela" },
  la:   { hex: "#8B5E00", nome: "Lá",   grau: "VI",  forma: "Hexágono" },
  si:   { hex: "#9B5FC0", nome: "Si",   grau: "VII", forma: "Casinha" },
} as const;

export const RNFG_ARRAY = Object.values(RNFG);

/* ── Paleta da Marca ── */
export const BRAND_COLORS = {
  primary:   "#0066FF",  // Sol — azul é a cor principal da marca
  primaryBg: "#0066FF10",
  accent:    "#9B5FC0",  // Si — lilás como cor secundária
  accentBg:  "#9B5FC020",
  success:   "#00B050",  // Fá — verde para sucesso
  warning:   "#F07300",  // Mi — laranja para aviso
  error:     "#C0001A",  // Dó — vermelho para erro
  surface:   "#141414",
  surface2:  "#1a1a1a",
  border:    "#222222",
  text:      "#e8e8e8",
  textDim:   "#888888",
  textMuted: "#555555",
  bg:        "#0a0a0a",
} as const;

/* ── Tipografia ── */
export const TYPOGRAPHY = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono:   "'JetBrains Mono', 'Fira Code', monospace",
  weights:    { light: 300, regular: 400, medium: 600, bold: 700, extrabold: 800 },
} as const;

/* ── Gradiente da marca (arco-íris RNFG) ── */
export const BRAND_GRADIENT = `linear-gradient(135deg,
  ${RNFG.do.hex}, ${RNFG.mi.hex}, ${RNFG.re.hex},
  ${RNFG.fa.hex}, ${RNFG.sol.hex}, ${RNFG.la.hex}, ${RNFG.si.hex})`;

/* ── Formas em SVG (path data) ── */
export const SHAPE_PATHS = {
  circulo:  "M12,0A12,12 0 1,0 12,24A12,12 0 1,0 12,0Z",
  ogiva:    "M12,0 L24,12 L12,24 L0,12 Z",
  triangulo:"M12,0 L24,21 L0,21 Z",
  quadrado: "M0,0 L24,0 L24,24 L0,24 Z",
  estrela:  "M12,0 L14.8,9 L24,9 L16.4,14.5 L19.2,24 L12,18.5 L4.8,24 L7.6,14.5 L0,9 L9.2,9 Z",
  hexagono: "M12,0 L22,6 L22,18 L12,24 L2,18 L2,6 Z",
  casinha:  "M12,0 L24,9.4 L24,24 L0,24 L0,9.4 Z",
} as const;

/* ── Formas em CSS clip-path ── */
export const SHAPE_CLIP = {
  circulo:  "circle(50%)",
  ogiva:    "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  triangulo:"polygon(50% 0%, 100% 100%, 0% 100%)",
  quadrado: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  estrela:  "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  hexagono: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
  casinha:  "polygon(50% 0%, 100% 39%, 100% 100%, 0% 100%, 0% 39%)",
} as const;
