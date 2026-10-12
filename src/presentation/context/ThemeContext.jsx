import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "hcms-theme";
const THEMES = ["light", "dark"];

const ThemeContext = createContext(undefined);

function isTheme(value) {
  return THEMES.includes(value);
}

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    return isTheme(savedTheme) ? savedTheme : null;
  } catch {
    return null;
  }
}

function getInitialTheme() {
  const savedTheme = getSavedTheme();

  if (savedTheme) {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
}

function persistTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Theme changes still work when storage is unavailable.
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    if (!isTheme(nextTheme)) {
      return;
    }

    applyTheme(nextTheme);
    persistTheme(nextTheme);
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => {
      const nextTheme = currentTheme === "light" ? "dark" : "light";
      applyTheme(nextTheme);
      persistTheme(nextTheme);
      return nextTheme;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
