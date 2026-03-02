import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header";
import DropZone from "./components/DropZone";
import FileList from "./components/FileList";
import FormatSelector from "./components/FormatSelector";
import ConversionOptions from "./components/ConversionOptions";
import Progress from "./components/Progress";
import Results from "./components/Results";
import { getFormats, convertFiles } from "./api/client";
import type {
  FileItem,
  ConversionSession,
  SupportedFormats,
  ConversionOptions as ConvOpts,
} from "./types";

type Step = "upload" | "configure" | "converting" | "results";

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } },
};

export default function App() {
  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("ac-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
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

  // ── Load formats once ──────────────────────────────────────────────────────
  useEffect(() => {
    getFormats()
      .then(setFormats)
      .catch((e) => console.error("Could not load formats:", e));
  }, []);

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
      setSession(result);
      setStep("results");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Conversion failed. Please retry.";
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
    <div className="min-h-screen bg-background">
      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="max-w-2xl mx-auto px-4 pb-20 pt-8">
        <AnimatePresence mode="wait">
          {/* ── Step: Upload ───────────────────────────────────────────── */}
          {step === "upload" && (
            <motion.div key="upload" {...pageVariants}>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-semibold tracking-tight mb-2">
                  Convert anything
                </h1>
                <p className="text-muted-foreground text-sm">
                  Images, audio, video and documents — locally, no cloud.
                </p>
              </div>
              <DropZone onFilesSelected={handleFilesAdded} />
            </motion.div>
          )}

          {/* ── Step: Configure ────────────────────────────────────────── */}
          {step === "configure" && (
            <motion.div key="configure" {...pageVariants} className="space-y-5">
              <FileList
                files={files}
                onRemove={handleRemoveFile}
                onAdd={handleFilesAdded}
              />

              <FormatSelector
                formats={formats}
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
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
                  >
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={handleConvert}
                disabled={!targetFormat || !files.length}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 px-6 rounded-2xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:opacity-90"
              >
                Convert {files.length} file{files.length !== 1 ? "s" : ""} →{" "}
                {targetFormat ? `.${targetFormat}` : "…"}
              </motion.button>
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
    </div>
  );
}
