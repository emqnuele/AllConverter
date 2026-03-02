import { motion } from "framer-motion";

interface ProgressProps {
  progress: number;
  fileCount: number;
  targetFormat: string;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Progress({ progress, fileCount, targetFormat }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const isProcessing = clamped >= 100;

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">

      {/* Circular SVG ring */}
      <div className="relative w-28 h-28 flex items-center justify-center">

        {/* Pulsing outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full dark:opacity-100 opacity-30"
          style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.15) 0%, transparent 70%)" }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
          {/* Track */}
          <circle
            cx="56" cy="56" r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="3.5"
          />
          {/* Progress arc */}
          <motion.circle
            cx="56" cy="56" r={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: isProcessing ? [offset, offset - 20, offset] : offset }}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            transition={
              isProcessing
                ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
                : { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
            }
            style={{
              filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.6))",
            }}
          />
        </svg>

        {/* Center percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-xl font-semibold tabular-nums tracking-tight"
            key={clamped}
          >
            {isProcessing ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="text-sm text-muted-foreground"
              >
                processing
              </motion.span>
            ) : (
              `${clamped}%`
            )}
          </motion.span>
        </div>
      </div>

      {/* Label */}
      <div className="text-center space-y-1.5">
        <p className="text-sm font-medium tracking-tight">
          Converting {fileCount} file{fileCount !== 1 ? "s" : ""} to{" "}
          <span className="font-bold uppercase text-primary">{targetFormat}</span>
        </p>
        <p className="text-xs text-muted-foreground">This may take a moment</p>
      </div>

      {/* Thin linear bar below */}
      <div className="w-full max-w-[280px]">
        <div className="h-[3px] w-full dark:bg-white/[0.06] bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(clamped, 3)}%` }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{ boxShadow: "0 0 8px hsl(var(--primary) / 0.5)" }}
          />
        </div>
      </div>

    </div>
  );
}
