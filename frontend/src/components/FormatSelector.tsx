import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ImageIcon, Music, Film, FileText } from "lucide-react";
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

function CategoryIcon({ category }: { category: FileCategory }) {
  const cls = "w-3.5 h-3.5";
  switch (category) {
    case "image":    return <ImageIcon className={cls} />;
    case "audio":    return <Music className={cls} />;
    case "video":    return <Film className={cls} />;
    case "document": return <FileText className={cls} />;
  }
}

export default function FormatSelector({
  formats,
  formatsError,
  onRetryFormats,
  files,
  value,
  onChange,
}: FormatSelectorProps) {
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
      <div className="glass h-24 rounded-2xl border-destructive/20 flex flex-col items-center justify-center gap-2">
        <p className="text-sm text-destructive">
          Could not reach the backend. Is the server running?
        </p>
        <button
          onClick={onRetryFormats}
          className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:opacity-75 transition-opacity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (!formats) {
    return (
      <div className="glass h-24 rounded-2xl flex items-center justify-center">
        <motion.span
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        >
          Loading formats
        </motion.span>
      </div>
    );
  }

  if (!detectedCategory) {
    return (
      <div className="glass p-4 rounded-2xl text-center">
        <p className="text-sm text-muted-foreground">
          Mixed file types detected — all files should be the same category.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Category label */}
      <div className="px-4 py-3 border-b border-border/60 dark:border-white/[0.05] flex items-center gap-2">
        <span className="text-muted-foreground">
          <CategoryIcon category={detectedCategory} />
        </span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {CATEGORY_LABELS[detectedCategory]} — Convert to
        </span>
      </div>

      {/* Format pills */}
      <AnimatePresence mode="wait">
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
                initial={{ opacity: 0, scale: 0.8, y: 4 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: {
                    delay: i * 0.018,
                    duration: 0.22,
                    type: "spring",
                    stiffness: 400,
                    damping: 22,
                  },
                }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onChange(fmt)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  active
                    ? "bg-primary text-primary-foreground dark:shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
                    : "dark:bg-white/[0.05] bg-muted text-muted-foreground hover:text-foreground dark:hover:bg-white/[0.09]"
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
