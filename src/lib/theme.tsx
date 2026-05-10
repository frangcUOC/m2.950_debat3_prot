import * as React from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const Ctx = React.createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  // Read persisted theme on mount (client-only to avoid SSR hydration mismatch).
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("tornai-theme") as Theme | null;
      const initial: Theme =
        stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setThemeState(initial);
    } catch {}
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("tornai-theme", theme);
    } catch {}
  }, [theme]);

  const value = React.useMemo<ThemeCtx>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
