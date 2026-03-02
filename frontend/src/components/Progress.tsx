import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ProgressProps {
  progress: number;
  fileCount: number;
  targetFormat: string;
}

export default function Progress({ progress, fileCount, targetFormat }: ProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {/* Spinning icon */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center"
      >
        <Loader2 className="w-7 h-7 text-primary" />
      </motion.div>

      {/* Label */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">
          Converting {fileCount} file{fileCount !== 1 ? "s" : ""} to{" "}
          <span className="font-semibold uppercase">{targetFormat}</span>…
        </p>
        <p className="text-xs text-muted-foreground">This may take a moment</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="flex justify-between text-xs text-muted-foreground mb-2">
          <span>Uploading &amp; converting</span>
          <span className="tabular-nums font-medium">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(progress, 4)}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* Indeterminate shimmer when at 100% (server processing) */}
        {progress >= 100 && (
          <motion.div
            className="mt-3 h-1 w-full bg-muted rounded-full overflow-hidden relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-primary/50 rounded-full"
              animate={{ x: ["−100%", "400%"] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
