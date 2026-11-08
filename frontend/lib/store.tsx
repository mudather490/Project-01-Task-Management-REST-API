"use client";
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import type { Lang } from "./api";
import en from "../messages/en.json";
import ar from "../messages/ar.json";

export type Theme = "light" | "dark" | "system";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: "ltr" | "rtl";
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

const dicts: Record<Lang, unknown> = { en, ar };

export function getNested(obj: unknown, path: string) {
  return path.split(".").reduce<any>((o, k) => (o == null ? o : (o as any)[k]), obj);
}

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("lang");
  return stored === "ar" ? "ar" : "en";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem("theme");
  return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
}

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [theme, setThemeState] = useState<Theme>("system");
  const [systemDark, setSystemDark] = useState(false);

  // Hydrate from localStorage after mount (the inline boot script has already
  // applied the class / dir before first paint, so there is no flash).
  useEffect(() => {
    setLangState(readStoredLang());
    setThemeState(readStoredTheme());
    setSystemDark(systemPrefersDark());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const isDark = theme === "dark" || (theme === "system" && systemDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", theme);
  }, [theme, systemDark]);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  const setLang = (l: Lang) => setLangState(l);
  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () =>
    setThemeState((current) =>
      current === "light" ? "dark" : current === "dark" ? "system" : "light"
    );

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>) => {
      const value = getNested(dicts[lang], key);
      let out = typeof value === "string" ? value : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return out;
    };
  }, [lang]);

  return (
    <StoreContext.Provider
      value={{
        lang,
        setLang,
        t,
        dir: lang === "ar" ? "rtl" : "ltr",
        theme,
        setTheme,
        resolvedTheme,
        toggleTheme,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
