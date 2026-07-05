import { useTheme } from "../../lib/theme";
import { SHAPE_CLIP } from "../../lib/brand";

export function ThemeSwitcher() {
  const { themeId, setTheme, allThemes } = useTheme();

  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider font-semibold px-1" style={{ color: "var(--textDim, #888)" }}>
        Tema · Rainhas Fadas
      </div>
      <div className="grid grid-cols-7 gap-1 px-1">
        {allThemes.map((fq, i) => {
          const isActive = themeId === fq.id;
          const clip = Object.values(SHAPE_CLIP)[i];
          return (
            <button
              key={fq.id}
              onClick={() => setTheme(fq.id)}
              title={`${fq.nome} — ${fq.rainha}`}
              className="relative w-full aspect-square rounded-lg transition-all duration-200"
              style={{
                background: fq.hex,
                ...(isActive ? { boxShadow: `0 0 0 2px white, 0 0 0 4px ${fq.hex}`, transform: "scale(1.1)", zIndex: 10 } : { opacity: 0.6 }),
              }}
            >
              <div
                className="absolute inset-1"
                style={{ background: "rgba(0,0,0,0.3)", clipPath: clip }}
              />
            </button>
          );
        })}
      </div>
      <div className="text-[10px] px-1 leading-tight" style={{ color: "var(--textMuted, #666)" }}>
        {allThemes.find((fq) => fq.id === themeId)?.rainha}
      </div>
    </div>
  );
}
