import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FolderOpen } from "lucide-react";
import type { FileItem } from "../types";
import { fileToItem } from "../utils/fileUtils";

interface DropZoneProps {
  onFilesSelected: (files: FileItem[]) => void;
}

export default function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFileList = useCallback(
    (list: FileList) => {
      const items = Array.from(list).map(fileToItem);
      if (items.length > 0) onFilesSelected(items);
    },
    [onFilesSelected]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) processFileList(e.dataTransfer.files);
    },
    [processFileList]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) processFileList(e.target.files);
      e.target.value = "";
    },
    [processFileList]
  );

  return (
    <motion.div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      animate={{
        borderColor: isDragging
          ? "hsl(var(--primary))"
          : "hsl(var(--border))",
        backgroundColor: isDragging
          ? "hsl(var(--accent))"
          : "transparent",
      }}
      transition={{ duration: 0.15 }}
      className="relative flex flex-col items-center justify-center w-full rounded-3xl border-2 border-dashed cursor-pointer select-none"
      style={{ minHeight: 280 }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={onInputChange}
      />

      <AnimatePresence mode="wait">
        {isDragging ? (
          <motion.div
            key="dropping"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="flex flex-col items-center gap-4 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center"
            >
              <Upload className="w-8 h-8 text-primary" />
            </motion.div>
            <p className="text-primary font-medium text-sm">Drop your files here</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="flex flex-col items-center gap-5 pointer-events-none px-8 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Upload className="w-7 h-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm mb-1">
                Drag &amp; drop your files here
              </p>
              <p className="text-muted-foreground text-xs">
                or click to browse from your computer
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Images", "Audio", "Video", "Documents"].map((cat) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-muted-foreground text-xs opacity-60">
              Up to 500 MB per file
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative corners */}
      <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-muted-foreground/20 rounded-tl-lg pointer-events-none" />
      <span className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-muted-foreground/20 rounded-tr-lg pointer-events-none" />
      <span className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-muted-foreground/20 rounded-bl-lg pointer-events-none" />
      <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-muted-foreground/20 rounded-br-lg pointer-events-none" />
    </motion.div>
  );
}
