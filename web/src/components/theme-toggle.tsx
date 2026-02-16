"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) return <div className="h-8 w-8" />;

  return (
    <button
      onClick={toggle}
      className="relative h-8 w-8 rounded-lg flex items-center justify-center transition-premium hover:bg-muted text-muted-foreground hover:text-foreground"
      aria-label="Alternar tema"
    >
      <Sun
        className="h-4 w-4 absolute transition-all duration-300"
        strokeWidth={1.5}
        style={{
          opacity: dark ? 0 : 1,
          transform: dark ? "rotate(90deg) scale(0)" : "rotate(0) scale(1)",
        }}
      />
      <Moon
        className="h-4 w-4 absolute transition-all duration-300"
        strokeWidth={1.5}
        style={{
          opacity: dark ? 1 : 0,
          transform: dark ? "rotate(0) scale(1)" : "rotate(-90deg) scale(0)",
        }}
      />
    </button>
  );
}
