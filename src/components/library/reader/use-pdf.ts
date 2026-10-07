"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
// TextItem is not re-exported from the package root (pdf.d.ts lists only the
// proxies/tasks) — the display/api module is the typed home for it.
import type { TextItem } from "pdfjs-dist/types/src/display/api";

/**
 * The reader's pdfjs plumbing. pdfjs-dist is loaded through a dynamic
 * import() INSIDE the effect so its (large) chunk is fetched only on the
 * reader route — the catalogue and record pages never pull it. The worker
 * is self-hosted from /public/pdf (same origin, CSP 'self').
 */

export type ReaderStatus = "loading" | "ready" | "error";

export const PDF_WORKER_SRC = "/pdf/pdf.worker.min.mjs";

/** Self-hosted base-14 font data (pdfjs needs it for non-embedded fonts). */
export const PDF_STANDARD_FONTS_URL = "/pdf/standard_fonts/";

/** Loaded document + page count + retry handle. */
export function usePdfDocument(fileUrl: string) {
  const [status, setStatus] = useState<ReaderStatus>("loading");
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const docRef = useRef<PDFDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setDoc(null);
    setNumPages(0);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        const document = await pdfjs.getDocument({
          url: fileUrl,
          standardFontDataUrl: PDF_STANDARD_FONTS_URL,
        }).promise;
        if (cancelled) {
          void document.destroy();
          return;
        }
        docRef.current = document;
        setDoc(document);
        setNumPages(document.numPages);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      if (docRef.current) {
        void docRef.current.destroy().catch(() => undefined);
        docRef.current = null;
      }
    };
  }, [fileUrl, retryKey]);

  const retry = useCallback(() => setRetryKey((key) => key + 1), []);
  return { status, doc, numPages, retry };
}

/**
 * Render one page into a canvas at CSS width `cssWidth`, scaled by
 * devicePixelRatio so phones get sharp text. A previous task held in
 * `taskRef` is cancelled first — pdfjs forbids two renders on one canvas.
 */
export async function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  taskRef: { current: RenderTask | null },
): Promise<void> {
  taskRef.current?.cancel();
  const page = await doc.getPage(pageNumber);
  const base = page.getViewport({ scale: 1 });
  const scale = cssWidth > 0 ? cssWidth / base.width : 1;
  const viewport = page.getViewport({ scale });
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;

  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;

  const context = canvas.getContext("2d");
  if (!context) return;
  const task = page.render({
    canvasContext: context,
    viewport,
    transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
  });
  taskRef.current = task;
  try {
    await task.promise;
  } catch {
    // cancelled by the next render — expected
  } finally {
    if (taskRef.current === task) taskRef.current = null;
  }
}

/** One page's text (items joined with spaces) via getTextContent. */
export async function pdfPageText(
  doc: PDFDocumentProxy,
  pageNumber: number,
): Promise<string> {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items
    .filter((item): item is TextItem => "str" in item)
    .map((item) => item.str)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
