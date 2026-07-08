import { WAVE_PATH, WAVE_NODES, SYMUSIC } from "../../lib/brand";

type Size = "sm" | "md" | "lg";
const SIZES = { sm: 20, md: 30, lg: 44 };
const FONT_SIZES = { sm: "text-xs", md: "text-lg", lg: "text-2xl" };
const SUB_SIZES = { sm: "text-[8px]", md: "text-[10px]", lg: "text-xs" };

const GRADIENT_ID = "cromusGrad";

export function Logo({ size = "md", showTagline = false }: { size?: Size; showTagline?: boolean }) {
  const svgW = 240;
  const svgH = 120;
  const displayW = SIZES[size] * 2;
  const displayH = displayW * (svgH / svgW);

  return (
    <div className="inline-flex items-center gap-2.5">
      <svg width={displayW} height={displayH} viewBox={`0 0 ${svgW} ${svgH}`} className="shrink-0">
        <defs>
          <linearGradient id={GRADIENT_ID} gradientUnits="userSpaceOnUse" x1="20" y1="0" x2="220" y2="0">
            <stop offset="0" stopColor="#C0001A" /><stop offset=".1667" stopColor="#ECD200" />
            <stop offset=".3333" stopColor="#F07300" /><stop offset=".5" stopColor="#00B050" />
            <stop offset=".6667" stopColor="#0066FF" /><stop offset=".8333" stopColor="#8B5E00" />
            <stop offset="1" stopColor="#9B5FC0" />
          </linearGradient>
        </defs>
        <path d={WAVE_PATH} fill="none" stroke={`url(#${GRADIENT_ID})`} strokeWidth="9" strokeLinecap="round" />
        {WAVE_NODES.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r="5" fill={n.c} />
        ))}
      </svg>
      <div className="flex flex-col leading-tight">
        <span className={`${FONT_SIZES[size]} font-semibold tracking-tight`}
          style={{ color: "#F5F2EA" }}
        >
          Note Form Pro
        </span>
        {showTagline && (
          <span className={`${SUB_SIZES[size]} font-medium tracking-wider`} style={{ color: "#A69B85" }}>
            {SYMUSIC.tagline.toLowerCase()}
          </span>
        )}
      </div>
    </div>
  );
}
