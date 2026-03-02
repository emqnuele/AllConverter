import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload } from "lucide-react";
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
      onClick={() => inputRef.current?.click()}
      animate={{
        boxShadow: isDragging
          ? "0 0 0 1px hsl(var(--primary) / 0.5), 0 0 50px hsl(var(--primary) / 0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.3)",
      }}
      transition={{ duration: 0.2 }}
      className="relative flex flex-col items-center justify-center w-full rounded-3xl cursor-pointer select-none overflow-hidden"
      style={{
        minHeight: 380,
        background: isDragging
          ? "hsl(var(--accent) / 0.5)"
          : undefined,
      }}
    >
      {/* Glass background */}
      <div className="absolute inset-0 glass rounded-3xl -z-10" />

      {/* Dashed border overlay */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          border: `1.5px dashed ${isDragging ? "hsl(var(--primary) / 0.6)" : "rgba(255,255,255,0.1)"}`,
          transition: "border-color 0.2s ease",
        }}
      />

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
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.88, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-4 pointer-events-none"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.75, ease: "easeInOut" }}
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.18)" }}
            >
              <Upload className="w-10 h-10 text-primary" />
            </motion.div>
            <p className="text-primary font-medium text-base tracking-tight">
              Release to add files
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-6 pointer-events-none px-8 text-center"
          >
            <motion.div
              className="w-20 h-20 rounded-3xl flex items-center justify-center dark:bg-white/[0.05] bg-muted"
              whileHover={{ scale: 1.05 }}
            >
              <Upload className="w-9 h-9 text-muted-foreground" />
            </motion.div>

            <div className="space-y-1.5">
              <p className="font-medium text-base">
                Drag &amp; drop your files here
              </p>
              <p className="text-muted-foreground text-sm">
                or click to browse from your computer
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {["Images", "Audio", "Video", "Documents"].map((cat, i) => (
                <motion.span
                  key={cat}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="px-4 py-1.5 rounded-full dark:bg-white/[0.05] bg-muted text-muted-foreground text-sm font-medium"
                >
                  {cat}
                </motion.span>
              ))}
            </div>

            <p className="text-muted-foreground/50 text-sm">
              Up to 300 MB per file
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((pos) => (
        <span
          key={pos}
          className="absolute pointer-events-none"
          style={{
            top: pos.startsWith("t") ? 14 : "auto",
            bottom: pos.startsWith("b") ? 14 : "auto",
            left: pos.endsWith("l") ? 14 : "auto",
            right: pos.endsWith("r") ? 14 : "auto",
            width: 14,
            height: 14,
            borderTop: pos.startsWith("t") ? `1.5px solid rgba(255,255,255,${isDragging ? 0.4 : 0.15})` : "none",
            borderBottom: pos.startsWith("b") ? `1.5px solid rgba(255,255,255,${isDragging ? 0.4 : 0.15})` : "none",
            borderLeft: pos.endsWith("l") ? `1.5px solid rgba(255,255,255,${isDragging ? 0.4 : 0.15})` : "none",
            borderRight: pos.endsWith("r") ? `1.5px solid rgba(255,255,255,${isDragging ? 0.4 : 0.15})` : "none",
            borderTopLeftRadius: pos === "tl" ? 5 : 0,
            borderTopRightRadius: pos === "tr" ? 5 : 0,
            borderBottomLeftRadius: pos === "bl" ? 5 : 0,
            borderBottomRightRadius: pos === "br" ? 5 : 0,
            transition: "border-color 0.2s ease",
          }}
        />
      ))}
    </motion.div>
  );
}
