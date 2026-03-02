import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2 } from "lucide-react";
import type { HistoryEntry } from "../hooks/useHistory";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function fileLabel(entry: HistoryEntry): string {
  if (entry.files.length === 1) return entry.files[0].name;
  return `${entry.files[0].name} +${entry.files.length - 1} more`;
}

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
}

export default function RecentHistory({ entries, onClear }: Props) {
  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
      className="mt-6"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground tracking-wide">
          <Clock className="w-3 h-3" />
          <span>Recent conversions</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-muted-foreground/60 hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* List */}
      <div className="glass rounded-2xl overflow-hidden divide-y divide-border/50 dark:divide-white/[0.04]">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              {/* Format badge */}
              <span className="shrink-0 inline-flex items-center justify-center w-10 h-6 rounded-md bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase">
                {entry.targetFormat}
              </span>

              {/* File names */}
              <span className="flex-1 min-w-0 text-xs text-foreground/80 truncate">
                {fileLabel(entry)}
              </span>

              {/* Time */}
              <span className="shrink-0 text-[11px] text-muted-foreground/60 tabular-nums">
                {relativeTime(entry.timestamp)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
