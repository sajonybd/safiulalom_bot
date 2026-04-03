import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";

type Language = "en" | "bn";
type Currency = "BDT" | "USD";

interface SettingsContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string) => string;
  currencySymbol: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("settings_language") as Language) || "en";
    }
    return "en";
  });
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("settings_currency") as Currency) || "BDT";
    }
    return "BDT";
  });

  // Load from local storage
  useEffect(() => {
    const savedLang = localStorage.getItem("settings_language") as Language;
    const savedCurr = localStorage.getItem("settings_currency") as Currency;
    if (savedLang) setLanguageState(savedLang);
    if (savedCurr) setCurrencyState(savedCurr);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("settings_language", lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem("settings_currency", curr);
  };

  const currencySymbol = currency === "BDT" ? "৳" : "$";

  const t = (key: string) => {
    return translations[language]?.[key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, currency, setLanguage, setCurrency, t, currencySymbol }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
