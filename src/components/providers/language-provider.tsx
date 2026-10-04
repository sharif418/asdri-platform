"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, LANG_COOKIE, type DictionaryKey } from "@/lib/i18n";
import type { Language } from "@/types";

interface LanguageContextValue {
  lang: Language;
  t: (key: DictionaryKey) => string;
  setLang: (lang: Language) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      document.documentElement.lang = next === "bn" ? "bn" : "en";
      document.documentElement.dataset.lang = next;
      router.refresh();
    },
    [router],
  );

  const toggle = useCallback(() => {
    setLang(lang === "bn" ? "en" : "bn");
  }, [lang, setLang]);

  const t = useCallback((key: DictionaryKey) => dictionaries[lang][key] ?? key, [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, t, setLang, toggle }),
    [lang, t, setLang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}
