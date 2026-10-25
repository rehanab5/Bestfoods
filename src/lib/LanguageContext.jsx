import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { translations } from "@/lib/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("bf_lang") || "es";
    } catch {
      return "es";
    }
  });

  const changeLang = useCallback((l) => {
    setLang(l);
    try {
      localStorage.setItem("bf_lang", l);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    changeLang(lang === "es" ? "en" : "es");
  }, [lang, changeLang]);

  const t = useCallback(
    (key, ...args) => {
      const dict = translations[lang] || translations.es;
      const val = dict[key];
      if (typeof val === "function") return val(...args);
      return val ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang: changeLang, toggle, t }),
    [lang, changeLang, toggle, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}