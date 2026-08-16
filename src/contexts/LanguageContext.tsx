'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from '@/locales/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'uz',
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('uz');

  useEffect(() => {
    const savedLang = localStorage.getItem('hr_lang') as Language;
    if (savedLang && (savedLang === 'uz' || savedLang === 'kr')) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('hr_lang', lang);
  };

  const t = (key: string, fallback?: string): string => {
    try {
      const dict = translations[language] || translations['uz'];
      if (dict && dict[key] !== undefined && typeof dict[key] === 'string') {
        return dict[key];
      }
      return fallback !== undefined ? fallback : key;
    } catch {
      return fallback !== undefined ? fallback : key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
