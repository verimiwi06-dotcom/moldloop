"use client";

import { useEffect, useRef, useState } from "react";

export function MoldMeter({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef<number | null>(null);
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayScore / 100) * circ;
  const color = displayScore > 70 ? "#FF4D4D" : displayScore > 40 ? "#FF8C42" : "#00E5CC";

  /* Smooth count animation using requestAnimationFrame */
  useEffect(() => {
    if (score === displayScore) return;

    const start = displayScore;
    const diff = score - start;
    const duration = Math.min(Math.abs(diff) * 18, 800); // adaptive speed, max 800ms
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      setDisplayScore(current);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  return (
    <div className="oc-card p-6 flex flex-col items-center gap-5" role="meter" aria-valuenow={displayScore} aria-valuemin={0} aria-valuemax={100} aria-label="Virulence score">
      <div className="relative w-[140px] h-[140px]">
        <svg className="w-full h-full -rotate-90">
          <circle cx="70" cy="70" r={r} stroke="rgba(136,146,176,0.1)" strokeWidth="5" fill="none" />
          <circle
            cx="70" cy="70" r={r}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.3s ease, stroke 0.6s ease, filter 0.6s ease",
              filter: `drop-shadow(0 0 8px ${color}50)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-heading tabular-nums" style={{ color }}>{displayScore}</span>
          <span className="text-[9px] text-muted tracking-[0.2em] uppercase mt-0.5">mold %</span>
        </div>
      </div>

      <div className="text-center space-y-1">
        <h4 className="text-xs font-medium text-muted tracking-[0.15em] uppercase">Virulence Score</h4>
        <p className="text-[11px] font-semibold tracking-wide" style={{ color }}>
          {displayScore === 0 ? "SYSTEM PURIFIED" :
           displayScore < 40 ? "MINOR DRIFT" :
           displayScore < 80 ? "REALITY INFECTED" : "TOTAL COLLAPSE"}
        </p>
      </div>
    </div>
  );
}
