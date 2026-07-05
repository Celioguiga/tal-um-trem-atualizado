import { BRAND, RNFG_ARRAY, SHAPE_PATHS } from "../../lib/brand";

type Size = "sm" | "md" | "lg";

const SIZES = { sm: 20, md: 28, lg: 40 };
const FONT_SIZES = { sm: "text-sm", md: "text-lg", lg: "text-2xl" };

export function Logo({ size = "md", showTagline = false }: { size?: Size; showTagline?: boolean }) {
  const s = SIZES[size];
  const gap = Math.round(s * 0.15);
  const shapeSize = Math.round(s * 0.45);

  return (
    <div className="inline-flex items-center gap-2">
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} className="shrink-0">
        {RNFG_ARRAY.map((c, i) => {
          const x = (i * (shapeSize + gap)) + (s - (RNFG_ARRAY.length * (shapeSize + gap) - gap)) / 2;
          const y = (s - shapeSize) / 2;
          return (
            <path
              key={c.nome}
              d={SHAPE_PATHS[Object.keys(SHAPE_PATHS)[i] as keyof typeof SHAPE_PATHS]}
              fill={c.hex}
              opacity={0.9}
              transform={`translate(${x}, ${y}) scale(${shapeSize / 24})`}
            />
          );
        })}
      </svg>
      <div className="flex flex-col leading-tight">
        <span className={`${FONT_SIZES[size]} font-bold text-white tracking-tight`}>
          {BRAND.name}
        </span>
        {showTagline && (
          <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">
            {BRAND.tagline}
          </span>
        )}
      </div>
    </div>
  );
}
