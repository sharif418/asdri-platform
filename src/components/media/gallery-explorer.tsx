"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Expand, Images } from "lucide-react";
import { pick, type Language, type LocalizedText } from "@/types";
import { toBnDigits } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

export interface GalleryPhotoData {
  src: string;
  alt: LocalizedText;
  caption: LocalizedText;
  album: LocalizedText;
}

interface GalleryExplorerProps {
  photos: GalleryPhotoData[];
  lang: Language;
}

/**
 * Photo gallery: album filter chips, masonry columns grid with
 * hover zoom, and a full lightbox (Radix Dialog — Esc close,
 * arrow-key navigation, focus trap) with caption + prev/next.
 */
export function GalleryExplorer({ photos, lang }: GalleryExplorerProps) {
  const albums = useMemo(() => {
    const seen: string[] = [];
    for (const photo of photos) {
      if (!seen.includes(photo.album.bn)) seen.push(photo.album.bn);
    }
    return seen;
  }, [photos]);

  const [active, setActive] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(
    () => (active === "all" ? photos : photos.filter((p) => p.album.bn === active)),
    [photos, active],
  );

  const current = openIndex !== null ? filtered[openIndex] ?? null : null;

  const step = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((prev) => {
        if (prev === null || filtered.length === 0) return prev;
        return (prev + direction + filtered.length) % filtered.length;
      });
    },
    [filtered.length],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (openIndex === null) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    },
    [openIndex, step],
  );

  return (
    <div>
      {/* ————— Album chips ————— */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={lang === "bn" ? "অ্যালবাম ফিল্টার" : "Album filter"}>
        <button
          type="button"
          role="tab"
          aria-selected={active === "all"}
          onClick={() => {
            setActive("all");
            setOpenIndex(null);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all",
            active === "all"
              ? "bg-primary text-primary-foreground shadow-md"
              : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          <Images aria-hidden className="h-3.5 w-3.5" />
          {lang === "bn" ? "সব ছবি" : "All photos"}
          <span className="ml-0.5 opacity-70">{toBnDigits(photos.length)}</span>
        </button>
        {albums.map((key) => {
          const label = pick(photos.find((p) => p.album.bn === key)?.album ?? { bn: key, en: key }, lang);
          const count = photos.filter((p) => p.album.bn === key).length;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => {
                setActive(key);
                setOpenIndex(null);
              }}
              className={cn(
                "rounded-full px-4 py-2 text-[13px] font-medium transition-all",
                active === key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {label}
              <span className="ml-1.5 opacity-70">{toBnDigits(count)}</span>
            </button>
          );
        })}
      </div>

      {/* ————— Masonry grid ————— */}
      <Stagger className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {filtered.map((photo, index) => (
          <RevealItem key={`${photo.src}-${index}`} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-haspopup="dialog"
              aria-label={pick(photo.alt, lang)}
              className="group relative block w-full overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-lg"
            >
              <img
                src={photo.src}
                alt={pick(photo.alt, lang)}
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-left opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <span className="block text-[11px] font-semibold text-gold">{pick(photo.album, lang)}</span>
                <span className="line-clamp-2 block text-[12px] leading-snug text-white">{pick(photo.caption, lang)}</span>
              </span>
              <span
                aria-hidden
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary opacity-0 shadow transition-opacity duration-300 group-hover:opacity-100 dark:bg-emerald-deep/90 dark:text-gold"
              >
                <Expand className="h-4 w-4" />
              </span>
            </button>
          </RevealItem>
        ))}
      </Stagger>

      {/* ————— Lightbox ————— */}
      <Dialog open={current !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        {current ? (
          <DialogContent
            className="max-w-4xl gap-0 overflow-hidden bg-black/95 p-0 sm:rounded-2xl"
            onKeyDown={onKeyDown}
          >
            <div className="relative flex min-h-[40vh] items-center justify-center bg-black p-2 sm:p-4">
              <img
                src={current.src}
                alt={pick(current.alt, lang)}
                className="max-h-[68vh] w-auto max-w-full rounded-lg object-contain"
              />

              {/* prev / next */}
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={lang === "bn" ? "পূর্ববর্তী ছবি" : "Previous photo"}
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-gold hover:text-gold-foreground sm:left-3"
              >
                <ChevronLeft aria-hidden className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={lang === "bn" ? "পরবর্তী ছবি" : "Next photo"}
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-gold hover:text-gold-foreground sm:right-3"
              >
                <ChevronRight aria-hidden className="h-6 w-6" />
              </button>

              <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {lang === "bn"
                  ? `${toBnDigits((openIndex ?? 0) + 1)} / ${toBnDigits(filtered.length)}`
                  : `${(openIndex ?? 0) + 1} / ${filtered.length}`}
              </span>
            </div>

            <div className="space-y-1.5 bg-black px-5 py-4 text-center">
              <DialogTitle className="font-heading text-sm font-semibold text-gold sm:text-base">
                {pick(current.alt, lang)}
              </DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed text-white/80">
                {pick(current.caption, lang)}
              </DialogDescription>
              <p className="text-[11px] uppercase tracking-wider text-white/40">{pick(current.album, lang)}</p>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
