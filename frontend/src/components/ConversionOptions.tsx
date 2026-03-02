import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Settings2 } from "lucide-react";
import type { FileItem, ConversionOptions as ConvOpts } from "../types";
import { inferCategory } from "../utils/fileUtils";
import ImageOptions from "./options/ImageOptions";
import AudioOptions from "./options/AudioOptions";
import VideoOptions from "./options/VideoOptions";
import DocumentOptions from "./options/DocumentOptions";

interface ConversionOptionsProps {
  files: FileItem[];
  targetFormat: string;
  value: ConvOpts;
  onChange: (opts: ConvOpts) => void;
}

export default function ConversionOptions({
  files,
  targetFormat,
  value,
  onChange,
}: ConversionOptionsProps) {
  const [open, setOpen] = useState(false);

  const category =
    files[0]?.category ?? (files[0] ? inferCategory(files[0].file) : null);

  const hasOptions = !!category;
  if (!hasOptions) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          <span>Advanced options</span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      {/* Options panel */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.25, ease: "easeOut" } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border">
              {category === "image" && (
                <ImageOptions value={value} onChange={onChange} />
              )}
              {category === "audio" && (
                <AudioOptions value={value} onChange={onChange} />
              )}
              {category === "video" && (
                <VideoOptions value={value} onChange={onChange} targetFormat={targetFormat} />
              )}
              {category === "document" && (
                <DocumentOptions value={value} onChange={onChange} targetFormat={targetFormat} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
