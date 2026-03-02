import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Header from "./components/Header";
import DropZone from "./components/DropZone";
import FileList from "./components/FileList";
import FormatSelector from "./components/FormatSelector";
import ConversionOptions from "./components/ConversionOptions";
import Progress from "./components/Progress";
import Results from "./components/Results";
import Footer from "./components/Footer";
import RecentHistory from "./components/RecentHistory";
import { getFormats, convertFiles } from "./api/client";
import { useHistory } from "./hooks/useHistory";
import { MAX_FILE_SIZE } from "./utils/fileUtils";
import type {
  FileItem,
  ConversionSession,
  SupportedFormats,
  ConversionOptions as ConvOpts,
} from "./types";

type Step = "upload" | "configure" | "converting" | "results";

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(3px)",
    transition: { duration: 0.24, ease: "easeIn" },
  },
};

export default function App() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("ac-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("ac-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === "light" ? "dark" : "light")),
    []
  );

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [formats, setFormats] = useState<SupportedFormats | null>(null);
  const [targetFormat, setTargetFormat] = useState("");
  const [options, setOptions] = useState<ConvOpts>({});
  const [progress, setProgress] = useState(0);
  const [session, setSession] = useState<ConversionSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formatsError, setFormatsError] = useState(false);
  const { entries: historyEntries, addEntry, clearHistory } = useHistory();

  const loadFormats = useCallback(() => {
    setFormatsError(false);
    getFormats()
      .then((f) => { setFormats(f); setFormatsError(false); })
      .catch(() => setFormatsError(true));
  }, []);

  useEffect(() => { loadFormats(); }, [loadFormats]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFilesAdded = useCallback((added: FileItem[]) => {
    setFiles((prev) => {
      const ids = new Set(prev.map((f) => f.name + f.size));
      const fresh = added.filter((f) => !ids.has(f.name + f.size));
      return [...prev, ...fresh];
    });
    setStep("configure");
    setError(null);
  }, []);

  const handleRemoveFile = useCallback(
    (id: string) => {
      const next = files.filter((f) => f.id !== id);
      setFiles(next);
      if (next.length === 0) {
        setStep("upload");
        setTargetFormat("");
        setOptions({});
      }
    },
    [files]
  );

  const handleConvert = useCallback(async () => {
    if (!files.length || !targetFormat) return;
    setStep("converting");
    setProgress(0);
    setError(null);
    try {
      const result = await convertFiles(
        files.map((f) => f.file),
        targetFormat,
        options as Record<string, unknown>,
        (p) => setProgress(p)
      );
      addEntry(
        files.map((f) => ({ name: f.name, size: f.size })),
        targetFormat
      );
      setSession(result);
      setStep("results");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Conversion failed. Please retry.";
      setError(msg);
      setStep("configure");
    }
  }, [files, targetFormat, options]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setTargetFormat("");
    setOptions({});
    setSession(null);
    setError(null);
    setStep("upload");
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden flex flex-col">

      {/* Ambient background orbs (dark mode only) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <motion.div
          className="absolute rounded-full opacity-0 dark:opacity-100"
          style={{
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle, hsl(188 100% 48% / 0.12) 0%, transparent 70%)",
            top: "-280px",
            left: "-180px",
          }}
          animate={{ scale: [1, 1.06, 1], x: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full opacity-0 dark:opacity-100"
          style={{
            width: "560px",
            height: "560px",
            background: "radial-gradient(circle, hsl(258 70% 60% / 0.08) 0%, transparent 70%)",
            bottom: "-220px",
            right: "-140px",
          }}
          animate={{ scale: [1, 1.08, 1], y: [0, -12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </div>

      <Header theme={theme} onToggleTheme={toggleTheme} onHome={handleReset} />

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pb-24 pt-14 w-full flex-grow">
        <AnimatePresence mode="wait">

          {/* ── Step: Upload ───────────────────────────────────────────── */}
          {step === "upload" && (
            <motion.div key="upload" {...pageVariants}>
              <div className="text-center mb-12">
                <motion.h1
                  className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4 text-gradient"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                >
                  Convert anything
                </motion.h1>
                <motion.p
                  className="text-muted-foreground text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.22, duration: 0.4 }}
                >
                  Images, audio, video and documents.
                </motion.p>
              </div>
              <DropZone onFilesSelected={handleFilesAdded} />
              <RecentHistory entries={historyEntries} onClear={clearHistory} />
            </motion.div>
          )}

          {/* ── Step: Configure ────────────────────────────────────────── */}
          {step === "configure" && (
            <motion.div key="configure" {...pageVariants} className="space-y-4">
              <FileList
                files={files}
                onRemove={handleRemoveFile}
                onAdd={handleFilesAdded}
              />

              <FormatSelector
                formats={formats}
                formatsError={formatsError}
                onRetryFormats={loadFormats}
                files={files}
                value={targetFormat}
                onChange={(fmt) => {
                  setTargetFormat(fmt);
                  setOptions({});
                }}
              />

              <AnimatePresence>
                {targetFormat && (
                  <motion.div
                    key="options"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <ConversionOptions
                      files={files}
                      targetFormat={targetFormat}
                      value={options}
                      onChange={setOptions}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.97, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/8 dark:bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {(() => {
                const oversized = files.filter((f) => f.size > MAX_FILE_SIZE);
                const hasOversized = oversized.length > 0;
                return (
                  <>
                    <AnimatePresence>
                      {hasOversized && (
                        <motion.div
                          key="oversized-warning"
                          initial={{ opacity: 0, scale: 0.97, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/8 dark:bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                        >
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            {oversized.length === 1
                              ? `"${oversized[0].name}" exceeds the 300 MB limit. Remove it to continue.`
                              : `${oversized.length} files exceed the 300 MB limit. Remove them to continue.`}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      onClick={handleConvert}
                      disabled={!targetFormat || !files.length || hasOversized}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="btn-primary-glow w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-35 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
                    >
                      Convert {files.length} file{files.length !== 1 ? "s" : ""} to{" "}
                      {targetFormat ? `.${targetFormat}` : "…"}
                    </motion.button>
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ── Step: Converting ───────────────────────────────────────── */}
          {step === "converting" && (
            <motion.div key="converting" {...pageVariants}>
              <Progress
                progress={progress}
                fileCount={files.length}
                targetFormat={targetFormat}
              />
            </motion.div>
          )}

          {/* ── Step: Results ──────────────────────────────────────────── */}
          {step === "results" && session && (
            <motion.div key="results" {...pageVariants}>
              <Results session={session} onConvertMore={handleReset} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
