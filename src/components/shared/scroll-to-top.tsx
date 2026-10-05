"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

/**
 * Floating scroll-to-top button — appears after 600px of scroll.
 * Respects reduced-motion for the fade.
 */
export function ScrollToTop() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={t("a11y.backToTop")}
      title={t("a11y.backToTop")}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gold/50 bg-emerald-deep/90 text-gold shadow-lg shadow-emerald-950/30 backdrop-blur transition-all duration-300 hover:bg-gold hover:text-gold-foreground ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp aria-hidden className="h-5 w-5" />
    </button>
  );
}
