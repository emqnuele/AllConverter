import { motion, AnimatePresence } from "framer-motion";
import { Download, DownloadCloud, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import type { ConversionSession } from "../types";
import { downloadUrl, downloadAllUrl } from "../api/client";
import { formatBytes } from "../utils/fileUtils";

interface ResultsProps {
  session: ConversionSession;
  onConvertMore: () => void;
}

export default function Results({ session, onConvertMore }: ResultsProps) {
  const { session_id, results, successful, total } = session;
  const allSuccess = successful === total;

  return (
    <div className="space-y-5">

      {/* Summary header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {allSuccess
              ? "All files converted"
              : `${successful} of ${total} files converted`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {successful > 0
              ? "Download individual files or get them all at once"
              : "Something went wrong — see errors below"}
          </p>
        </div>

        {/* Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${
            allSuccess
              ? "dark:bg-success/[0.12] bg-success/10 text-success"
              : "dark:bg-destructive/[0.12] bg-destructive/10 text-destructive"
          }`}
        >
          {successful}/{total}
        </div>
      </motion.div>

      {/* File result cards */}
      <div className="grid gap-2.5">
        <AnimatePresence>
          {results.map((r, i) => (
            <motion.div
              key={r.original_name}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  delay: i * 0.07,
                  duration: 0.32,
                  ease: [0.25, 0.46, 0.45, 0.94],
                },
              }}
              className={`glass flex items-center gap-3 p-3.5 rounded-2xl ${
                !r.success ? "border-destructive/20 dark:border-destructive/15" : ""
              }`}
            >
              {/* Status icon */}
              <div
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                  r.success
                    ? "dark:bg-success/[0.12] bg-success/10"
                    : "dark:bg-destructive/[0.12] bg-destructive/10"
                }`}
              >
                {r.success ? (
                  <CheckCircle2 className="w-[18px] h-[18px] text-success" />
                ) : (
                  <XCircle className="w-[18px] h-[18px] text-destructive" />
                )}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.output_filename}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.success
                    ? r.size ? formatBytes(r.size) : "Converted"
                    : r.error ?? "Conversion failed"}
                </p>
              </div>

              {/* Download */}
              {r.success && (
                <motion.a
                  href={downloadUrl(session_id, r.output_filename)}
                  download={r.output_filename}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl dark:bg-white/[0.05] dark:hover:bg-white/[0.09] bg-muted hover:bg-accent text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </motion.a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <motion.div
        className="flex gap-3 pt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: results.length * 0.07 + 0.1 }}
      >
        {successful > 1 && (
          <motion.a
            href={downloadAllUrl(session_id)}
            download
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary-glow flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <DownloadCloud className="w-4 h-4" />
            Download all (.zip)
          </motion.a>
        )}

        <motion.button
          onClick={onConvertMore}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`glass flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-medium hover:text-foreground text-muted-foreground transition-colors ${
            successful <= 1 ? "flex-1" : ""
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Convert more
        </motion.button>
      </motion.div>

    </div>
  );
}
