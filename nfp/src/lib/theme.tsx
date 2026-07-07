import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { RNFG } from "./brand";

export const FAIRY_QUEENS = [
  { id: "do",   nome: "Vermelho Carmim",   rainha: "Rainha Fada do Fogo",     hex: RNFG.do.hex },
  { id: "re",   nome: "Amarelo Encarnado", rainha: "Rainha Fada da Luz",      hex: RNFG.re.hex },
  { id: "mi",   nome: "Laranja Vivo",      rainha: "Rainha Fada da Chama",    hex: RNFG.mi.hex },
  { id: "fa",   nome: "Verdemato",         rainha: "Rainha Fada da Floresta", hex: RNFG.fa.hex },
  { id: "sol",  nome: "Azuldatarde",       rainha: "Rainha Fada do Céu",      hex: RNFG.sol.hex },
  { id: "la",   nome: "Marrom Dourado",    rainha: "Rainha Fada da Terra",    hex: RNFG.la.hex },
  { id: "si",   nome: "Lilás Claro",       rainha: "Rainha Fada do Sonho",    hex: RNFG.si.hex },
] as const;

export type ThemeId = (typeof FAIRY_QUEENS)[number]["id"];

export type ThemeVars = {
  "--bg": string;
  "--surface": string;
  "--surface2": string;
  "--border": string;
  "--accent": string;
  "--accentGlow": string;
  "--text": string;
  "--textDim": string;
  "--textMuted": string;
  "--gold": string;
};

const BASE = {
  "--bg": "#FFFFFF",
  "--surface": "#F5F7FA",
  "--surface2": "#EBF0F5",
  "--border": "#D0D8E0",
  "--text": "#1A2A3A",
  "--textDim": "#556677",
  "--textMuted": "#8899AA",
  "--gold": "#E8A820",
} as const;

export function getThemeVars(id: ThemeId): ThemeVars {
  const fq = FAIRY_QUEENS.find((f) => f.id === id)!;
  return {
    ...BASE,
    "--accent": fq.hex,
    "--accentGlow": `${fq.hex}25`,
  };
}

const DEFAULT_THEME: ThemeId = "sol";

const ThemeContext = createContext<{
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  vars: ThemeVars;
  current: (typeof FAIRY_QUEENS)[number];
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
  }, [themeId]);

  const vars = getThemeVars(themeId);
  const current = FAIRY_QUEENS.find((f) => f.id === themeId)!;

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, vars, current, allThemes: FAIRY_QUEENS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
