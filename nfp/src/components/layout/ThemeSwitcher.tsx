import { useTheme } from "../../lib/theme";

export function ThemeSwitcher() {
  const { themeId, setTheme, current, allThemes, vars } = useTheme();

  return (
    <div>
      <div className="flex items-center justify-center gap-1.5">
        {allThemes.map((fq) => {
          const isActive = themeId === fq.id;
          return (
            <button
              key={fq.id}
              onClick={() => setTheme(fq.id)}
              title={`${fq.nome} — ${fq.rainha}`}
              className="w-5 h-5 rounded-full transition-all duration-200"
              style={{
                background: fq.hex,
                transform: isActive ? "scale(1.3)" : "scale(1)",
                opacity: isActive ? 1 : 0.4,
                boxShadow: isActive ? `0 0 8px ${fq.hex}80` : "none",
              }}
            />
          );
        })}
      </div>
      <div className="text-[10px] text-center mt-1.5 leading-tight" style={{ color: vars["--textMuted"] }}>
        {current.rainha}
      </div>
    </div>
  );
}
