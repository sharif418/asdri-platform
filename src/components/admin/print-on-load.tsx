"use client";

import { useEffect } from "react";

/**
 * Auto-print bridge for print-pad pages opened in a new tab (the exam-call
 * letter). Adds the body class that isolates the pad in the print
 * stylesheet, waits until the page's images (the brand mark, the applicant's
 * photo) have settled so the printed sheet is complete, then opens the print
 * dialog once — and always removes the class again afterwards.
 */
export function PrintOnLoad({ bodyClass }: { bodyClass: "printing-exam-letter" }) {
  useEffect(() => {
    let cancelled = false;
    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      window.removeEventListener("afterprint", cleanup);
    };
    const print = () => {
      if (cancelled) return;
      document.body.classList.add(bodyClass);
      window.addEventListener("afterprint", cleanup);
      window.print();
      // Safety net for engines that never fire afterprint (headless included).
      window.setTimeout(cleanup, 60_000);
    };

    const loading = Array.from(document.images).filter((image) => !image.complete);
    if (loading.length === 0) {
      print();
      return () => {
        cancelled = true;
        cleanup();
      };
    }
    let pending = loading.length;
    const onSettled = () => {
      pending -= 1;
      if (pending === 0) print();
    };
    loading.forEach((image) => {
      image.addEventListener("load", onSettled, { once: true });
      image.addEventListener("error", onSettled, { once: true });
    });
    return () => {
      cancelled = true;
      loading.forEach((image) => {
        image.removeEventListener("load", onSettled);
        image.removeEventListener("error", onSettled);
      });
      cleanup();
    };
  }, [bodyClass]);

  return null;
}
