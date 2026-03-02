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

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {successful === total
              ? "All files converted!"
              : `${successful} of ${total} files converted`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {successful > 0
              ? "Click individual files or download all at once"
              : "Something went wrong — see errors below"}
          </p>
        </div>

        {/* Success badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            successful === total
              ? "bg-success/10 text-success"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {successful}/{total}
        </div>
      </div>

      {/* File cards */}
      <div className="grid gap-2.5">
        <AnimatePresence>
          {results.map((r, i) => (
            <motion.div
              key={r.original_name}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: i * 0.06, duration: 0.3, ease: "easeOut" },
              }}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border ${
                r.success
                  ? "bg-card border-border"
                  : "bg-destructive/5 border-destructive/20"
              }`}
            >
              {/* Status icon */}
              <div
                className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                  r.success ? "bg-success/10" : "bg-destructive/10"
                }`}
              >
                {r.success ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>

              {/* Names */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {r.output_filename}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {r.success
                    ? r.size
                      ? `${formatBytes(r.size)}`
                      : "Converted"
                    : r.error ?? "Conversion failed"}
                </p>
              </div>

              {/* Download button */}
              {r.success && (
                <motion.a
                  href={downloadUrl(session_id, r.output_filename)}
                  download={r.output_filename}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </motion.a>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {successful > 1 && (
          <motion.a
            href={downloadAllUrl(session_id)}
            download
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <DownloadCloud className="w-4 h-4" />
            Download all (.zip)
          </motion.a>
        )}

        <motion.button
          onClick={onConvertMore}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-border bg-card text-sm font-medium hover:bg-muted transition-colors ${
            successful <= 1 ? "flex-1" : ""
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Convert more
        </motion.button>
      </div>
    </div>
  );
}
