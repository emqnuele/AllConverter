import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

interface HeaderProps {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onHome?: () => void;
}

/* Two overlapping rounded squares: outlined (source) + filled (output) */
function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true" className="shrink-0">
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5"
        stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <rect x="11.5" y="11.5" width="13" height="13" rx="3.5"
        fill="hsl(var(--primary))" />
    </svg>
  );
}

export default function Header({ theme, onToggleTheme, onHome }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 dark:border-white/[0.05] bg-background/80 dark:bg-background/60 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        <motion.button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 cursor-pointer focus:outline-none"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <LogoMark />
          <span className="font-semibold text-sm tracking-tight text-foreground/90">
            allconverter
          </span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.button
              key={theme}
              onClick={onToggleTheme}
              initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 20, scale: 0.7 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted/60 hover:bg-muted dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Moon className="w-[15px] h-[15px]" />
              ) : (
                <Sun className="w-[15px] h-[15px]" />
              )}
            </motion.button>
          </AnimatePresence>
        </motion.div>

      </div>
    </header>
  );
}
