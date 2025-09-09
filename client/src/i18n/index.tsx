import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// Language code type; allow any code present in locales
type Language = string;

type Dictionary = Record<string, string>;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLangs: Language[];
}

const I18N_KEY = "lang";

// Eagerly import all locale JSON files under ./locales
const modules = import.meta.glob("./locales/*.json", { eager: true }) as Record<string, any>;
const dictionaries: Record<Language, Dictionary> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    const match = path.match(/\/([^/]+)\.json$/);
    const code = match ? match[1] : path;
    const dict: Dictionary = (mod && (mod.default ?? mod)) as Dictionary;
    return [code, dict];
  })
);

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  availableLangs: ["en"],
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = (localStorage.getItem(I18N_KEY) as Language) || "en";
    if (dictionaries[saved]) {
      setLangState(saved);
    } else {
      setLangState("en");
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem(I18N_KEY, l);
  };

  const dict = useMemo(() => dictionaries[lang] || {}, [lang]);
  const availableLangs = useMemo(() => Object.keys(dictionaries), []);

  const t = (key: string, params?: Record<string, string | number>) => {
    let str = dict[key] || key;
    if (params) {
      for (const [p, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${p}\\}`, "g"), String(v));
      }
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t, availableLangs }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
