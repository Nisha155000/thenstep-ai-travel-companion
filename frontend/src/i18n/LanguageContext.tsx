import React, { createContext, useContext, useState, useEffect } from 'react';
import enTranslations from './en.json';
import knTranslations from './kn.json';
import hiTranslations from './hi.json';

export type LanguageCode = 'en' | 'kn' | 'hi';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyPath: string) => string;
}

const dictionaries: Record<LanguageCode, any> = {
  en: enTranslations,
  kn: knTranslations,
  hi: hiTranslations,
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (keyPath: string) => keyPath,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('thenstep_lang') as LanguageCode;
    return saved === 'kn' || saved === 'hi' ? saved : 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('thenstep_lang', lang);
  };

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let curr = dictionaries[language];
    for (const k of keys) {
      if (curr && typeof curr === 'object' && k in curr) {
        curr = curr[k];
      } else {
        // Fallback to English
        let fallback = dictionaries.en;
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object' && fk in fallback) {
            fallback = fallback[fk];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === 'string' ? fallback : keyPath;
      }
    }
    return typeof curr === 'string' ? curr : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
