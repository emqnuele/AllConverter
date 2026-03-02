import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Minus, Plus } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = triggerRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inTrigger && !inDropdown) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className="w-full h-9 px-3 rounded-xl border border-border dark:border-white/[0.08] bg-transparent dark:bg-white/[0.03] text-foreground text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all duration-200 cursor-pointer"
      >
        <span className="truncate">{selected?.label ?? ""}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open &&
          createPortal(
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed z-[9999] rounded-xl border border-border dark:border-white/[0.07] overflow-hidden py-1"
              style={{
                top: coords.top,
                left: coords.left,
                width: coords.width,
                background: "hsl(var(--card))",
                backdropFilter: "blur(20px) saturate(160%)",
                WebkitBackdropFilter: "blur(20px) saturate(160%)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {options.map((opt) => {
                const isActive = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-2 transition-colors ${
                      isActive
                        ? "text-primary bg-primary/[0.08] dark:bg-primary/[0.1] font-medium"
                        : "text-foreground hover:bg-muted/60 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </motion.div>,
            document.body
          )}
      </AnimatePresence>
    </>
  );
}

/* ── NumberInput ─────────────────────────────────────────────────────────── */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
}: {
  value: number | string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
}) {
  const adjust = (dir: 1 | -1) => {
    const n = parseFloat(String(value));
    if (isNaN(n)) {
      onChange(String(min ?? 0));
      return;
    }
    const raw = n + dir * step;
    const clamped =
      min !== undefined && max !== undefined
        ? Math.min(max, Math.max(min, raw))
        : min !== undefined
        ? Math.max(min, raw)
        : max !== undefined
        ? Math.min(max, raw)
        : raw;
    onChange(String(parseFloat(clamped.toFixed(10))));
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pr-[3.75rem]"
      />
      <div className="absolute right-1 flex items-center gap-0.5">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjust(-1)}
          className="w-6 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/[0.07] transition-colors"
        >
          <Minus className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => adjust(1)}
          className="w-6 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/[0.07] transition-colors"
        >
          <Plus className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
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
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        className={`relative w-9 h-5 rounded-full shrink-0 cursor-pointer transition-colors duration-200 ${
          checked ? "bg-primary" : "dark:bg-white/[0.08] bg-muted"
        }`}
        style={{ boxShadow: checked ? "0 0 10px hsl(var(--primary)/0.35)" : "none" }}
      >
        <motion.div
          animate={{ x: checked ? 16 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </div>
    </label>
  );
}
