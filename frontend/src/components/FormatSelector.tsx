import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import type { FileCategory, FileItem, SupportedFormats } from "../types";
import { inferCategory } from "../utils/fileUtils";

interface FormatSelectorProps {
  formats: SupportedFormats | null;
  formatsError?: boolean;
  onRetryFormats?: () => void;
  files: FileItem[];
  value: string;
  onChange: (fmt: string) => void;
}

const CATEGORY_LABELS: Record<FileCategory, string> = {
  image: "Image",
  audio: "Audio",
  video: "Video",
  document: "Document",
};

const CATEGORY_EMOJI: Record<FileCategory, string> = {
  image: "🖼",
  audio: "🎵",
  video: "🎬",
  document: "📄",
};

export default function FormatSelector({
  formats,
  formatsError,
  onRetryFormats,
  files,
  value,
  onChange,
}: FormatSelectorProps) {
  // Determine which category the uploaded files belong to
  const detectedCategory = useMemo<FileCategory | null>(() => {
    if (!files.length) return null;
    const cats = files.map((f) => f.category ?? inferCategory(f.file));
    const uniq = [...new Set(cats.filter(Boolean))];
    return uniq.length === 1 ? (uniq[0] as FileCategory) : null;
  }, [files]);

  const availableFormats = useMemo<string[]>(() => {
    if (!formats || !detectedCategory) return [];
    return formats[detectedCategory]?.output ?? [];
  }, [formats, detectedCategory]);

  if (formatsError) {
    return (
      <div className="h-24 rounded-2xl border border-destructive/30 bg-destructive/5 flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-destructive">
          Could not reach the backend. Is the server running?
        </p>
        <button
          onClick={onRetryFormats}
          className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:opacity-80 transition-opacity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!formats) {
    return (
      <div className="h-24 rounded-2xl border border-border bg-muted/30 flex items-center justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">
          Loading formats…
        </span>
      </div>
    );
  }

  if (!detectedCategory) {
    return (
      <div className="p-4 rounded-2xl border border-border bg-card text-center">
        <p className="text-sm text-muted-foreground">
          Mixed file types detected — all files should be the same category.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Category label */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-base">{CATEGORY_EMOJI[detectedCategory]}</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {CATEGORY_LABELS[detectedCategory]} — Convert to
        </span>
      </div>

      {/* Format grid */}
      <AnimatePresence>
        <motion.div
          key={detectedCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 flex flex-wrap gap-2"
        >
          {availableFormats.map((fmt, i) => {
            const active = value === fmt;
            return (
              <motion.button
                key={fmt}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  transition: { delay: i * 0.02, duration: 0.2 },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(fmt)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium uppercase tracking-wide transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {fmt}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
