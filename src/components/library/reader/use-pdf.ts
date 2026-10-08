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
 *
 * Returns the page's geometry hook (round-10 overlay): `toViewport` maps a
 * BASE-space (scale-1) rectangle into this render's viewport pixels, so an
 * overlay canvas can paint highlights dpr-identical to the page beneath.
 */
export interface PageGeometry {
  cssWidth: number;
  cssHeight: number;
  dpr: number;
  /** base-space [x1, y1, x2, y2] → viewport-space CSS pixels [x1, y1, x2, y2]. */
  toViewport: (rect: [number, number, number, number]) => [number, number, number, number];
}

export async function renderPdfPage(
  doc: PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  cssWidth: number,
  taskRef: { current: RenderTask | null },
): Promise<PageGeometry | null> {
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
  if (!context) return null;
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
  return {
    cssWidth: Math.floor(viewport.width),
    cssHeight: Math.floor(viewport.height),
    dpr,
    toViewport: (rect) => {
      const [x1, y1, x2, y2] = viewport.convertToViewportRectangle(rect);
      return [x1, y1, x2, y2] as [number, number, number, number];
    },
  };
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

/* ————— complex-script search canonicalization —————
 * Chromium-printed PDFs (the office's main pipeline for Bangla documents)
 * extract Bengali in VISUAL order: pre-base vowel signs (ি ে ৈ) arrive
 * before their consonant ("দেন" → "েদ ন"), conjunct ligatures without a
 * ToUnicode mapping surface as NUL, and glyph clusters come back as
 * separate items that plain joining pads with spaces — so a logical-order
 * query never matches. Search therefore runs over a whitespace-squashed
 * haystack against BOTH the plain query and a visual-order variant of it,
 * with an index map carrying match positions back into the display text
 * for snippets. Latin and Arabic text are unaffected (the swap only
 * touches Bengali codepoints).
 */

/** Pre-base Bengali vowel signs — they render LEFT of their consonant. */
const PRE_BASE_SIGNS = new Set(["\u09bf", "\u09c7", "\u09c8"]);

function isBengaliConsonant(ch: string): boolean {
  const c = ch.codePointAt(0);
  if (c === undefined) return false;
  return (
    (c >= 0x0995 && c <= 0x09b9) || // ক … হ
    (c >= 0x09dc && c <= 0x09df) || // ড় ঢ় য়
    c === 0x09ce || // ৎ
    (c >= 0x09f0 && c <= 0x09f1) // ৰ ৱ
  );
}

/**
 * Swap every pre-base vowel sign with the Bengali consonant immediately
 * after it — the inverse of the shaping rule. Applied to a query, it
 * produces the visual-order spelling a Chromium PDF actually contains;
 * applied to already-visual text it reconstructs logical order. The result
 * has the SAME length (a permutation), so index maps stay valid.
 */
export function swapPreBaseSigns(input: string): string {
  const chars = [...input];
  for (let i = 0; i + 1 < chars.length; i++) {
    if (PRE_BASE_SIGNS.has(chars[i]) && isBengaliConsonant(chars[i + 1])) {
      const swap = chars[i];
      chars[i] = chars[i + 1];
      chars[i + 1] = swap;
      i++; // the swapped-in sign cannot pair with the next consonant
    }
  }
  return chars.join("");
}

/** Whitespace/NUL-squashed, lowercased — the normalized search form. */
export function searchSquash(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\s\u0000]+/g, "");
}

export interface PageIndexItem {
  /** Character range in the page's display text — offsets are exact. */
  from: number;
  through: number;
  /** Base-space (scale-1) rectangle: lower-left + size, in PDF units. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PageSearchIndex {
  /** Display text (NULs stripped) — snippets are cut from this. */
  text: string;
  /** searchSquash(text) — matches logical-order queries. */
  haystack: string;
  /** swapPreBaseSigns(haystack) — matches visual-order (Chromium) text. */
  haystackSwapped: string;
  /** haystack[i] / haystackSwapped[i] → index into text. */
  map: number[];
  /** Per-item geometry (round-10 overlay): which text chars live where. */
  items: PageIndexItem[];
}

/** Build the dual-form search index for one page. */
export async function pdfPageSearchIndex(
  doc: PDFDocumentProxy,
  pageNumber: number,
): Promise<PageSearchIndex> {
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();

  // Text is built INCREMENTALLY so every item's character range is exact —
  // the overlay highlights whole text items by intersecting a match's
  // [from, through] range with these ranges.
  const items: PageIndexItem[] = [];
  let text = "";
  for (const raw of content.items) {
    if (!("str" in raw)) continue;
    const item = raw as TextItem;
    const cleaned = item.str.replace(/[\u0000\s]+/g, " ").trim();
    if (cleaned === "") continue;
    if (text.length > 0) text += " ";
    const from = text.length;
    text += cleaned;
    const transform = item.transform; // [a, b, c, d, e, f] — e,f = lower-left
    const fontSize = Math.hypot(transform[2], transform[3]) || Math.hypot(transform[0], transform[1]) || 10;
    items.push({
      from,
      through: text.length - 1,
      x: transform[4],
      y: transform[5],
      w: item.width || 0,
      h: item.height || fontSize,
    });
  }

  const lowered = text.toLowerCase();
  const hayStackChars: string[] = [];
  const map: number[] = [];
  for (let i = 0; i < lowered.length; i++) {
    const ch = lowered[i];
    if (ch === " ") continue;
    hayStackChars.push(ch);
    map.push(i);
  }
  const haystack = hayStackChars.join("");
  return { text, haystack, haystackSwapped: swapPreBaseSigns(haystack), map, items };
}
