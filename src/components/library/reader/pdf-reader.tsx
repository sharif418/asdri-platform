"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RenderTask } from "pdfjs-dist";
import { AlertTriangle, Loader2 } from "lucide-react";
import { BrandMonoMark } from "@/components/shared/logo";
import { toBnDigits } from "@/lib/format";
import { pick, type Language } from "@/types";
import { ReaderToolbar } from "@/components/library/reader/reader-toolbar";
import {
  ReaderSearchResults,
  MAX_MATCHES,
  type PdfSearchMatch,
} from "@/components/library/reader/reader-search";
import {
  pdfPageSearchIndex,
  searchSquash,
  swapPreBaseSigns,
  renderPdfPage,
  usePdfDocument,
  type PageGeometry,
  type PageSearchIndex,
} from "@/components/library/reader/use-pdf";

/**
 * The in-browser PDF reader client island. pdfjs-dist is imported lazily
 * inside usePdfDocument — only this route ever downloads it. Rendering
 * happens to one canvas at devicePixelRatio; zoom multiplies the fit-width
 * scale (reset = fit). Search walks getTextContent per page and lists the
 * matches; keyboard ←/→/PageUp/PageDown turn pages; every forward page move
 * posts a read counter (rate-limited server side).
 */

interface PdfReaderProps {
  lang: Language;
  itemId: string;
  fileUrl: string;
  fileName?: string | null;
  title: { bn: string; en: string };
  filePages?: number | null;
}

export function PdfReader({
  lang,
  itemId,
  fileUrl,
  fileName,
  title,
  filePages,
}: PdfReaderProps) {
  const bn = lang === "bn";
  const { status, doc, numPages, retry } = usePdfDocument(fileUrl);

  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [matches, setMatches] = useState<PdfSearchMatch[]>([]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const lastSeenPage = useRef(1);
  /** the current render's geometry (page/zoom); the overlay paints through it */
  const geometryRef = useRef<PageGeometry | null>(null);
  /** page → search index (built during runSearch, reused by the overlay) */
  const indexCacheRef = useRef<Map<number, PageSearchIndex>>(new Map());

  const totalPages = numPages > 0 ? numPages : (filePages ?? 0);
  const goToPage = useCallback(
    (next: number) => {
      setPage((current) => {
        const clamped = Math.min(
          Math.max(1, next),
          Math.max(1, totalPages || 1),
        );
        return clamped === current ? current : clamped;
      });
    },
    [totalPages],
  );

  /* ————— the gold overlay (round-10): paints highlight boxes for the
     current page's matches, whole text items, through the render's own
     viewport mapping — dpr-identical to the page beneath. ————— */
  const repaintOverlay = useCallback(() => {
    const overlay = overlayRef.current;
    const geometry = geometryRef.current;
    if (!overlay || !geometry) return;
    const context = overlay.getContext("2d");
    if (!context) return;
    const { dpr } = geometry;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, geometry.cssWidth, geometry.cssHeight);

    const index = indexCacheRef.current.get(page);
    if (!index || matches.length === 0) return;

    // gold fill + stroke, soft enough to read text through
    context.fillStyle = "rgba(201, 162, 39, 0.22)";
    context.strokeStyle = "rgba(201, 162, 39, 0.75)";
    context.lineWidth = 1;

    for (const match of matches) {
      if (match.page !== page) continue;
      for (const item of index.items) {
        // whole-item highlight: the item's char range intersects the match
        if (item.through < match.from || item.from > match.through) continue;
        const [x1, y1, x2, y2] = geometry.toViewport([
          item.x,
          item.y,
          item.x + item.w,
          item.y + item.h,
        ]);
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const boxWidth = Math.max(2, Math.abs(x2 - x1));
        const boxHeight = Math.max(2, Math.abs(y2 - y1));
        context.fillRect(left, top, boxWidth, boxHeight);
        context.strokeRect(left + 0.5, top + 0.5, boxWidth - 1, boxHeight - 1);
      }
    }
  }, [page, matches]);

  // repaint when the matches or the page change (the render effect repaints
  // after geometry changes itself)
  useEffect(() => {
    repaintOverlay();
  }, [repaintOverlay]);

  /* ————— responsive width (fit-width zoom base) ————— */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(Math.floor(width));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  /* ————— render the current page ————— */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (status !== "ready" || !doc || !canvas || containerWidth <= 0) return;
    const width = Math.max(220, containerWidth - 4) * zoom;
    let stale = false;
    void renderPdfPage(doc, page, canvas, width, renderTaskRef)
      .then((geometry) => {
        if (!stale && geometry) {
          geometryRef.current = geometry;
          // size the overlay to match the fresh render
          const overlay = overlayRef.current;
          if (overlay) {
            overlay.width = Math.floor(geometry.cssWidth * geometry.dpr);
            overlay.height = Math.floor(geometry.cssHeight * geometry.dpr);
            overlay.style.width = `${geometry.cssWidth}px`;
            overlay.style.height = `${geometry.cssHeight}px`;
          }
          repaintOverlay();
        }
      })
      .catch(() => undefined);
    return () => {
      stale = true;
    };
  }, [status, doc, page, zoom, containerWidth, repaintOverlay]);

  /* ————— reading counter: forward moves only ————— */
  useEffect(() => {
    if (page <= lastSeenPage.current) return;
    lastSeenPage.current = page;
    void fetch("/api/library/readings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ itemId, page }),
      keepalive: true,
    }).catch(() => undefined);
  }, [page, itemId]);

  /* ————— keyboard: ← → PageUp PageDown ————— */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      )
        return;
      switch (event.key) {
        case "ArrowRight":
        case "PageDown":
          event.preventDefault();
          goToPage(page + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          event.preventDefault();
          goToPage(page - 1);
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [page, goToPage]);

  /* ————— in-document text search ————— */
  const runSearch = useCallback(
    async (nextQuery: string) => {
      const trimmed = nextQuery.trim();
      setQuery(trimmed);
      setMatches([]);
      if (!trimmed || !doc) return;
      setSearching(true);
      const needle = searchSquash(trimmed);
      // Chromium-printed Bangla PDFs store text in visual order (ে/ি before
      // their consonant). haystackSwapped is the visual→logical
      // reconstruction, so the plain (logical) needle is searched against
      // BOTH forms; dedupe keeps one hit per position.
      const found: PdfSearchMatch[] = [];
      for (
        let pageNumber = 1;
        pageNumber <= doc.numPages && found.length < MAX_MATCHES;
        pageNumber++
      ) {
        const index = await pdfPageSearchIndex(doc, pageNumber);
        indexCacheRef.current.set(pageNumber, index);
        const seen = new Set<number>();
        const collect = (haystack: string, visual: boolean) => {
          let at = haystack.indexOf(needle);
          while (at !== -1 && found.length < MAX_MATCHES) {
            if (!seen.has(at)) {
              seen.add(at);
              const from = index.map[at] ?? 0;
              const through = index.map[at + needle.length - 1] ?? from;
              const raw = index.text
                .slice(Math.max(0, from - 42), through + 1 + 64)
                .replace(/\s+/g, " ")
                .trim();
              // a hit on the swapped form means the text is visual-order
              // (Chromium PDF) — reconstruct logical order for the snippet
              found.push({
                page: pageNumber,
                snippet: visual ? swapPreBaseSigns(raw) : raw,
                from,
                through,
              });
            }
            at = haystack.indexOf(needle, at + needle.length);
          }
        };
        collect(index.haystack, false);
        collect(index.haystackSwapped, true);
      }
      setMatches(found);
      setSearching(false);
    },
    [doc],
  );

  /* clear the overlay when a new search clears the matches */
  useEffect(() => {
    if (matches.length === 0) repaintOverlay();
  }, [query, matches.length, repaintOverlay]);

  /* ————— states ————— */
  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
          <AlertTriangle aria-hidden className="h-7 w-7" />
        </span>
        <h2 className="font-heading mt-4 text-lg font-semibold">
          {bn ? "পিডিএফটি লোড করা যায়নি" : "The PDF could not be loaded"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {bn
            ? "সংযোগ বিচ্ছিন্ন হয়েছে বা ফাইলটি ক্ষণিকের জন্য পাওয়া যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।"
            : "The connection dropped or the file is momentarily unavailable. Please try again."}
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Loader2 aria-hidden className="h-4 w-4" />
          {bn ? "আবার চেষ্টা করুন" : "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ReaderToolbar
        lang={lang}
        page={page}
        numPages={totalPages}
        onPage={goToPage}
        zoom={zoom}
        onZoomChange={setZoom}
        onSearch={(nextQuery) => void runSearch(nextQuery)}
        searching={searching}
        matchCount={matches.length}
        hasQuery={query.trim().length > 0}
      />

      <ReaderSearchResults
        lang={lang}
        query={query}
        matches={matches}
        searching={searching}
        onJump={goToPage}
      />

      {/* ————— the page stage ————— */}
      <div
        ref={stageRef}
        className="reader-stage relative flex justify-center overflow-x-auto rounded-2xl border border-gold/20 bg-parchment/70 p-3 shadow-inner dark:bg-secondary/40 sm:p-5"
      >
        {status === "loading" ? (
          <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 text-center">
            <span className="relative flex h-16 w-16 items-center justify-center">
              <BrandMonoMark tone="emerald" className="h-14 animate-pulse" />
            </span>
            <p className="font-heading text-sm font-semibold text-foreground/80">
              {bn ? "পিডিএফ লোড হচ্ছে…" : "Loading the PDF…"}
            </p>
            <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              {fileName ? `${fileName} · ` : ""}
              {bn
                ? "একটু ধৈর্য ধরুন — প্রথম পৃষ্ঠা এখনই আসছে।"
                : "One moment — the first page is on its way."}
            </p>
          </div>
        ) : (
          <div className="relative mx-auto" style={{ width: "fit-content" }}>
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`${pick(title, lang)} — ${bn ? `পৃষ্ঠা ${toBnDigits(page)}` : `page ${page}`}`}
              className="block h-auto max-w-full rounded-md bg-white shadow-md"
            />
            {/* the gold highlight overlay: pointer-transparent so the page
                beneath stays interactive, print-hidden so the printed copy is
                the clean page, dpr-matched to the render */}
            <canvas
              ref={overlayRef}
              aria-hidden
              className="reader-chrome pointer-events-none absolute left-0 top-0 rounded-md print:hidden"
            />
          </div>
        )}
      </div>

      <p className="reader-chrome text-center text-[11.5px] text-muted-foreground">
        {bn
          ? `পৃষ্ঠা ${toBnDigits(page)} / ${toBnDigits(Math.max(1, totalPages))} দেখা হচ্ছে — প্রিন্ট করলে এই পৃষ্ঠাটিই ছাপা হবে।`
          : `Viewing page ${page} of ${Math.max(1, totalPages)} — printing prints exactly this page.`}
      </p>
    </div>
  );
}
