import { motion } from "framer-motion";

interface StreakRingProps {
  done: number;
  total: number;
  size?: number;
}

export default function StreakRing({ done, total, size = 168 }: StreakRingProps) {
  const pct = total === 0 ? 0 : Math.min(1, done / total);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--pastel-lavender))" />
            <stop offset="100%" stopColor="hsl(var(--pastel-pink))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * pct }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-display text-5xl font-bold text-gradient leading-none">
            {Math.round(pct * 100)}%
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {done}/{total} done
          </div>
        </div>
      </div>
    </div>
  );
}
