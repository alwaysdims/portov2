import { createContext, useState, useEffect, useMemo } from "react";
import en from "../locales/en";
import id from "../locales/id";

const translations = { en, id };

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("portfolio-lang") || "en";
  });

  useEffect(() => {
    localStorage.setItem("portfolio-lang", language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "en" ? "id" : "en"));
  };

  const t = useMemo(() => translations[language], [language]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
