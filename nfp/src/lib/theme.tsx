import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export const FAIRY_QUEENS = [
  { id: "do",   nome: "Vermelho Carmim",   rainha: "Rainha Fada do Fogo",     hex: "#C0001A" },
  { id: "re",   nome: "Amarelo Encarnado", rainha: "Rainha Fada da Luz",      hex: "#ECD200" },
  { id: "mi",   nome: "Laranja Vivo",      rainha: "Rainha Fada da Chama",    hex: "#F07300" },
  { id: "fa",   nome: "Verdemato",         rainha: "Rainha Fada da Floresta", hex: "#00B050" },
  { id: "sol",  nome: "Azuldatarde",       rainha: "Rainha Fada do Céu",      hex: "#0066FF" },
  { id: "la",   nome: "Marrom Dourado",    rainha: "Rainha Fada da Terra",    hex: "#8B5E00" },
  { id: "si",   nome: "Lilás Claro",       rainha: "Rainha Fada do Sonho",    hex: "#9B5FC0" },
] as const;

export type ThemeId = (typeof FAIRY_QUEENS)[number]["id"];

function darken(hex: string, pct: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.round(((num >> 16) & 255) * (1 - pct));
  const g = Math.round(((num >> 8) & 255) * (1 - pct));
  const b = Math.round((num & 255) * (1 - pct));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export type ThemeVars = {
  "--bg": string;
  "--surface": string;
  "--surface2": string;
  "--border": string;
  "--borderLight": string;
  "--primary": string;
  "--primaryGlow": string;
  "--text": string;
  "--textDim": string;
  "--textMuted": string;
};

export function getThemeVars(id: ThemeId): ThemeVars {
  const fq = FAIRY_QUEENS.find((f) => f.id === id)!;
  const isLight = id === "re";
  return {
    "--bg": fq.hex,
    "--surface": darken(fq.hex, 0.25),
    "--surface2": darken(fq.hex, 0.35),
    "--border": darken(fq.hex, 0.50),
    "--borderLight": darken(fq.hex, 0.40),
    "--primary": fq.hex,
    "--primaryGlow": `${fq.hex}40`,
    "--text": isLight ? "#111" : "#f0f0f0",
    "--textDim": isLight ? "#333" : "#bbb",
    "--textMuted": isLight ? "#666" : "#777",
  };
}

const DEFAULT_THEME: ThemeId = "sol";

const ThemeContext = createContext<{
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  vars: ThemeVars;
  allThemes: typeof FAIRY_QUEENS;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setTheme] = useState<ThemeId>(() => {
    if (typeof window !== "undefined")
      return (localStorage.getItem("nfp-theme") as ThemeId) || DEFAULT_THEME;
    return DEFAULT_THEME;
  });

  useEffect(() => {
    localStorage.setItem("nfp-theme", themeId);
    // Sincroniza o fundo do body com o tema
    const vars = getThemeVars(themeId);
    document.body.style.background = vars["--bg"];
    document.body.style.color = vars["--text"];
  }, [themeId]);

  const vars = getThemeVars(themeId);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, vars, allThemes: FAIRY_QUEENS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
