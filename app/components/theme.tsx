import React, { createContext, useContext, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const initialState: ThemeProviderState = {
  theme: "system",
  isDark: false,
  toggleTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  // FIX: Initialize state with a check for 'window' to avoid Server-Side Crash
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    }
    return defaultTheme; // Fallback for server rendering
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // This hook only runs on the client, so it's safe to use window here
    const root = window.document.documentElement;
    const systemQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const systemIsDark = systemQuery.matches;
      const shouldUseDark = theme === "dark" || (theme === "system" && systemIsDark);

      if (shouldUseDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      setIsDark(shouldUseDark);
    };

    applyTheme();

    const listener = () => {
      if (theme === "system") applyTheme();
    };

    systemQuery.addEventListener("change", listener);
    return () => systemQuery.removeEventListener("change", listener);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  return (
    <ThemeProviderContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

// --- Reusable Button Component ---
export function ThemeToggle({ className }: { className?: string }) {
  // We need to ensure we don't render the toggle functionality until the client is ready,
  // otherwise we might get hydration mismatches on the icon state.
  const [mounted, setMounted] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render a placeholder or nothing during SSR to avoid mismatch
  if (!mounted) {
    return <div className={`w-9 h-9 rounded-full bg-[var(--color-muted)]/50 ${className}`} />;
  }

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-all duration-300 hover:bg-[var(--color-muted)] ${className}`}
      title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
    >
      <div className="relative w-5 h-5">
        <Sun
          className={`absolute inset-0 w-full h-full transition-all duration-500
            ${isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}
            text-[var(--color-foreground)]`}
        />
        <Moon
          className={`absolute inset-0 w-full h-full transition-all duration-500
            ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}
            text-[var(--color-foreground)]`}
        />
      </div>
    </button>
  );
}
