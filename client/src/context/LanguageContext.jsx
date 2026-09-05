import React from 'react';
const { createContext, useContext } = React;
import viTranslations from '../locales/vi';
import enTranslations from '../locales/en';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  // Try to use the Language context; if it throws (no provider / hooks unavailable)
  try {
    const { language, translations } = useLanguage();

    const t = (key, params = {}) => {
      const keys = key.split('.');
      let value = translations;

      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = value[k];
        } else {
          // Fallback to Vietnamese if key not found
          const viValue = keys.reduce((obj, k) => obj?.[k], viTranslations);
          return viValue || key;
        }
      }

      // Replace params in string (e.g., "Hello {name}" -> "Hello John")
      if (typeof value === 'string' && Object.keys(params).length > 0) {
        return value.replace(/\{(\w+)\}/g, (match, key) => params[key] || match);
      }

      return value || key;
    };

    return { t, language };
  } catch (err) {
    // Fallback: provide a minimal t() using Vietnamese translations so components don't crash
    console.warn('[Language] useTranslation fallback active:', err && err.message);
    const t = (key, params = {}) => {
      const keys = key.split('.');
      const viValue = keys.reduce((obj, k) => obj?.[k], viTranslations);
      if (typeof viValue === 'string') {
        if (Object.keys(params).length === 0) return viValue;
        return viValue.replace(/\{(\w+)\}/g, (match, name) => params[name] || match);
      }
      return key;
    };
    return { t, language: 'vi' };
  }
};

export const LanguageProvider = ({ children }) => {
  // Guard: if React hooks are not available (duplicate React / SW cached bundle),
  // avoid calling hooks to prevent app crash. Render children directly and log helpful info.
  if (typeof React === 'undefined' || typeof React.useState !== 'function') {
    try {
      console.error('[LanguageProvider] React hooks unavailable. Possible duplicate React or corrupted cache.');
    } catch {}
    return <>{children}</>;
  }

  const [language, setLanguage] = React.useState('vi');

  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'vi';
    setLanguage(savedLanguage);
  }, []);

  const translations = React.useMemo(() => {
    return language === 'vi' ? viTranslations : enTranslations;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    // Trigger custom event để các component khác có thể lắng nghe
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: newLang }));
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
};

