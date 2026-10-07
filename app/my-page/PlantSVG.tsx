"use client";

export type PlantStage = "seed" | "sprout" | "sapling" | "tree" | "bigtree" | "bloom";

export function getPlantStage(totalDays: number): PlantStage {
  if (totalDays >= 600) return "bloom";
  if (totalDays >= 300) return "bigtree";
  if (totalDays >= 180) return "tree";
  if (totalDays >= 90) return "sapling";
  if (totalDays >= 30) return "sprout";
  return "seed";
}

// ─────────────────────────────────────────────
// SVG 식물 일러스트
// ─────────────────────────────────────────────
export default function PlantSVG({ stage, watering = false, size = 80, compact = false }: { stage: PlantStage; watering?: boolean; size?: number; compact?: boolean }) {
  return (
    <div className="relative flex items-end justify-center" style={{ width: size, height: size * 90 / 80 }}>
      <svg viewBox={compact && stage === "seed" ? "0 52 80 40" : compact && stage === "sprout" ? "0 40 80 50" : "0 0 80 90"} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        {/* 화분 */}
        <ellipse cx="40" cy="82" rx="22" ry="5" fill="#c8a97e" opacity="0.4" />
        <path d="M20 72 Q18 85 40 87 Q62 85 60 72 Z" fill="#d4956a" />
        <rect x="17" y="68" width="46" height="7" rx="3" fill="#e8a87c" />
        {/* 흙 */}
        <ellipse cx="40" cy="68" rx="22" ry="4" fill="#8B6340" />

        {/* 씨앗 */}
        {stage === "seed" && (
          <ellipse cx="40" cy="63" rx="5" ry="4" fill="#a0785a" />
        )}

        {/* 새싹 */}
        {stage === "sprout" && (
          <>
            <line x1="40" y1="67" x2="40" y2="50" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="33" cy="54" rx="7" ry="4" fill="#86efac" transform="rotate(-30 33 54)" />
            <ellipse cx="47" cy="56" rx="7" ry="4" fill="#4ade80" transform="rotate(30 47 56)" />
          </>
        )}

        {/* 묘목 */}
        {stage === "sapling" && (
          <>
            <line x1="40" y1="67" x2="40" y2="40" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="29" cy="48" rx="10" ry="6" fill="#86efac" transform="rotate(-25 29 48)" />
            <ellipse cx="51" cy="50" rx="10" ry="6" fill="#4ade80" transform="rotate(25 51 50)" />
            <ellipse cx="40" cy="40" rx="9" ry="7" fill="#22c55e" />
          </>
        )}

        {/* 나무 */}
        {stage === "tree" && (
          <>
            <line x1="40" y1="67" x2="40" y2="32" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
            <line x1="40" y1="52" x2="28" y2="44" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="40" y1="48" x2="52" y2="40" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="40" cy="30" r="14" fill="#22c55e" />
            <circle cx="28" cy="38" r="9" fill="#4ade80" />
            <circle cx="52" cy="36" r="9" fill="#16a34a" />
          </>
        )}

        {/* 큰 나무 */}
        {stage === "bigtree" && (
          <>
            <line x1="40" y1="67" x2="40" y2="26" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
            <line x1="40" y1="50" x2="24" y2="40" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <line x1="40" y1="44" x2="56" y2="34" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="24" r="17" fill="#16a34a" />
            <circle cx="24" cy="36" r="11" fill="#22c55e" />
            <circle cx="56" cy="32" r="11" fill="#15803d" />
            <circle cx="40" cy="14" r="10" fill="#4ade80" />
          </>
        )}

        {/* 꽃나무 */}
        {stage === "bloom" && (
          <>
            <line x1="40" y1="67" x2="40" y2="24" stroke="#15803d" strokeWidth="5" strokeLinecap="round" />
            <line x1="40" y1="50" x2="22" y2="38" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <line x1="40" y1="44" x2="58" y2="32" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="22" r="17" fill="#16a34a" />
            <circle cx="22" cy="34" r="11" fill="#22c55e" />
            <circle cx="58" cy="30" r="11" fill="#15803d" />
            <circle cx="40" cy="12" r="10" fill="#4ade80" />
            {/* 꽃 */}
            {[
              [40, 8], [28, 18], [52, 18], [22, 30], [58, 26],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="4" fill="#fbbf24" />
                {[0, 60, 120, 180, 240, 300].map((deg, j) => (
                  <ellipse
                    key={j}
                    cx={cx + 6 * Math.cos((deg * Math.PI) / 180)}
                    cy={cy + 6 * Math.sin((deg * Math.PI) / 180)}
                    rx="3"
                    ry="2"
                    fill="#f9a8d4"
                    transform={`rotate(${deg} ${cx + 6 * Math.cos((deg * Math.PI) / 180)} ${cy + 6 * Math.sin((deg * Math.PI) / 180)})`}
                  />
                ))}
              </g>
            ))}
          </>
        )}
      </svg>

      {/* 물방울 애니메이션 */}
      {watering && (
        <div className="absolute inset-0 pointer-events-none">
          {[20, 35, 50, 65].map((x, i) => (
            <div
              key={i}
              className="absolute text-blue-400 text-xs animate-bounce"
              style={{
                left: `${x}%`,
                top: `${10 + i * 8}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.6s",
              }}
            >
              💧
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

