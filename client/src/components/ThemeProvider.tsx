import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "oled" | "colorful";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    
    // Remove all theme classes
    document.documentElement.classList.remove("dark", "oled", "colorful");
    
    // Add current theme class
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "oled") {
      // OLED should also enable dark mode styles so existing `dark:` classes apply
      document.documentElement.classList.add("oled");
      document.documentElement.classList.add("dark");
    } else if (theme === "colorful") {
      document.documentElement.classList.add("colorful");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
