"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (`/sw.js`) once the window has
 * fully loaded. Progressive enhancement — strictly opt-in:
 *
 *  - production builds only (dev/Turbopack asset URLs are volatile, and a
 *    caching worker would interfere with hot reload);
 *  - never on localhost/127.0.0.1 (sandbox preview + local production runs
 *    stay clean — `navigator.serviceWorker.getRegistrations()` stays empty);
 *  - only when the browser actually supports service workers.
 *
 * Any registration failure is swallowed silently — offline support must
 * never surface as a console error or break the page.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    function register(): void {
      if (!("serviceWorker" in navigator)) return;

      const host = window.location.hostname;
      const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "::1";
      const isProduction = process.env.NODE_ENV === "production";

      if (!isProduction || isLocalHost) return;

      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Offline support is best-effort; ignore registration errors.
      });
    }

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
