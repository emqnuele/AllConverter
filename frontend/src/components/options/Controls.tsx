import type { ReactNode } from "react";
import { motion } from "framer-motion";

/* ── Field wrapper ──────────────────────────────────────────────────────── */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 flex-1 min-w-0">
      <span className="text-xs font-medium text-muted-foreground tracking-wide">{label}</span>
      {children}
    </label>
  );
}

/* ── Row of 2 fields ────────────────────────────────────────────────────── */
export function Row({ children }: { children: ReactNode }) {
  return <div className="flex gap-3">{children}</div>;
}

/* ── Select ─────────────────────────────────────────────────────────────── */
export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field dark:bg-white/[0.03]"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="dark:bg-[#0e0e17]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── Slider ─────────────────────────────────────────────────────────────── */
export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  unit = "",
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tracking-wide">{label}</span>
        <span className="text-xs font-bold tabular-nums text-foreground/80">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 rounded-full dark:bg-white/[0.06] bg-muted accent-primary cursor-pointer"
      />
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────────────── */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-0.5">
      <span className="text-xs font-medium text-muted-foreground tracking-wide">{label}</span>
      <motion.div
        onClick={() => onChange(!checked)}
        animate={{
          backgroundColor: checked
            ? "hsl(var(--primary))"
            : "rgba(255,255,255,0.08)",
        }}
        transition={{ duration: 0.18 }}
        className="relative w-9 h-5 rounded-full shrink-0 cursor-pointer"
        style={{ boxShadow: checked ? "0 0 10px hsl(var(--primary)/0.35)" : "none" }}
      >
        <motion.div
          animate={{ x: checked ? 16 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </motion.div>
    </label>
  );
}
