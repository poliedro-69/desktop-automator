import { useState, useEffect } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "activitysim-theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage not available
  }
  // Respect OS preference as fallback
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    // Trigger subtle animation
    document.body.style.animation = "themeFlip 0.18s ease-out";
    const t = setTimeout(() => { document.body.style.animation = ""; }, 200);
    return () => clearTimeout(t);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggle };
}
