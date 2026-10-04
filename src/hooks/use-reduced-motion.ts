"use client";

import { useCallback, useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Hydration-safe `prefers-reduced-motion` detection.
 *
 * framer-motion's `useReducedMotion()` returns its client value during the
 * hydration render, so a server-rendered `motion.div` (with initial inline
 * styles) can be matched against a client plain-`<div>` branch — React then
 * logs a hydration attribute mismatch. `useSyncExternalStore` avoids this:
 * the server snapshot (`false`) is used for the hydration render, and a
 * differing client value re-renders afterwards as a normal update.
 */
export function usePrefersReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mql = window.matchMedia(QUERY);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
