'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Language = 'en' | 'es';
type Translations = Record<string, string>;

interface I18nContextType {
  lang: Language;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const dictionaries: Record<Language, Translations> = { en, es };

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('es'); // Default to Spanish as requested
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('app-lang') as Language | null;
    if (saved && (saved === 'en' || saved === 'es')) {
      setLang(saved);
    }
    setMounted(true);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'es' : 'en';
    setLang(newLang);
    localStorage.setItem('app-lang', newLang);
  };

  const t = (key: string): string => {
    const dictionary = dictionaries[lang];
    if (!dictionary) return key;
    return dictionary[key] || key;
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <I18nContext.Provider value={{ lang, t, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used within I18nProvider');
  return context;
}
