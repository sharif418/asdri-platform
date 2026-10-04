"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { dictionaries, type DictionaryKey } from "@/lib/i18n";
import type { Language } from "@/types";
import { otherLang } from "@/lib/locale";

/**
 * Language context. The URL is the source of truth: /x renders Bangla, /en/x
 * renders English (the proxy rewrites bare paths to /bn/x internally). The
 * switcher navigates the visitor to the SAME page in the other language.
 */
interface LanguageContextValue {
  lang: Language;
  t: (key: DictionaryKey) => string;
  setLang: (lang: Language) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Map an internal pathname (/bn/x or /en/x) to the public display path (/x). */
function displayPath(pathname: string): string {
  if (pathname.startsWith("/en")) return pathname.slice(3) || "/";
  if (pathname.startsWith("/bn")) return pathname.slice(3) || "/";
  return pathname;
}

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Language;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Language>(initialLang);
  const router = useRouter();
  const pathname = usePathname();

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      const base = displayPath(pathname);
      const target = next === "en" ? `/en${base === "/" ? "" : base}` : base;
      router.push(target);
    },
    [pathname, router],
  );

  const toggle = useCallback(() => {
    setLang(otherLang(lang));
  }, [lang, setLang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      t: (key: DictionaryKey) => dictionaries[lang][key] ?? key,
      setLang,
      toggle,
    }),
    [lang, setLang, toggle],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}
