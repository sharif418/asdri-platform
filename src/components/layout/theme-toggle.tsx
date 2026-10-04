"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

const emptySubscribe = () => () => undefined;

/**
 * Light/dark theme toggle for the utility bar.
 * Uses useSyncExternalStore for a hydration-safe mounted flag
 * (server snapshot false → client snapshot true) without setState-in-effect.
 */
export function ThemeToggle() {
  const { lang } = useLanguage();
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return (
      <span
        aria-hidden
        className="inline-flex h-6 w-9 items-center rounded-full border border-ivory/25"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark
    ? lang === "bn"
      ? "লাইট মোডে যান"
      : "Switch to light mode"
    : lang === "bn"
      ? "ডার্ক মোডে যান"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="group relative inline-flex h-6 w-11 items-center rounded-full border border-ivory/25 bg-white/5 transition-colors hover:border-gold/70"
    >
      <span
        className={`absolute flex h-4.5 w-4.5 items-center justify-center rounded-full transition-all duration-300 ${
          isDark ? "left-[22px] bg-gold text-emerald-deep" : "left-1 bg-ivory text-emerald-deep"
        }`}
        style={{ height: "1.1rem", width: "1.1rem" }}
      >
        {isDark ? (
          <Moon aria-hidden className="h-3 w-3" />
        ) : (
          <Sun aria-hidden className="h-3 w-3" />
        )}
      </span>
    </button>
  );
}
