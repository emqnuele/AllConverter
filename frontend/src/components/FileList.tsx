import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import type { FileItem } from "../types";
import { fileToItem, formatBytes, fileIcon } from "../utils/fileUtils";

interface FileListProps {
  files: FileItem[];
  onRemove: (id: string) => void;
  onAdd: (files: FileItem[]) => void;
}

export default function FileList({ files, onRemove, onAdd }: FileListProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const items = Array.from(e.target.files).map(fileToItem);
      onAdd(items);
      e.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add more
        </motion.button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={handleInputChange}
        />
      </div>

      {/* File list */}
      <ul className="divide-y divide-border max-h-64 overflow-y-auto">
        <AnimatePresence initial={false}>
          {files.map((f, i) => (
            <motion.li
              key={f.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{
                opacity: 1,
                x: 0,
                transition: { delay: i * 0.04, duration: 0.25 },
              }}
              exit={{ opacity: 0, x: -16, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 px-4 py-3 group"
            >
              {/* Icon */}
              <span className="text-base shrink-0">{fileIcon(f.category)}</span>

              {/* Name + size */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(f.size)}
                </p>
              </div>

              {/* Remove */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onRemove(f.id)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove file"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
