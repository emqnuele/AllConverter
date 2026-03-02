import { Github, Globe } from "lucide-react";

export default function Footer() {
  const links = [
    {
      label: "GitHub",
      href: "https://github.com/emqnuele",
      icon: Github,
    },
    {
      label: "Portfolio",
      href: "https://emanuelefaraci.com",
      icon: Globe,
    },
  ];

  return (
    <footer className="relative z-10 border-t border-border/30 dark:border-white/[0.05]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-center">
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Coded by{" "}
          <span className="font-semibold text-foreground">emqnuele</span>
        </p>

        <div className="flex items-center justify-center gap-4">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary dark:hover:bg-white/[0.03] hover:bg-muted transition-all duration-200"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-6">
          Built with React, Vite & Framer Motion
        </p>
      </div>
    </footer>
  );
}
