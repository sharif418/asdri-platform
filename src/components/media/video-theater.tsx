"use client";

import { useMemo, useState } from "react";
import { Clock3, ExternalLink, Lightbulb, MonitorPlay, PlayCircle, Youtube } from "lucide-react";
import { pick, type Language, type LocalizedText } from "@/types";
import { toBnDigits } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stagger, RevealItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

/** Video card projection (serialized server-side from @/content/media). */
export interface VideoCardData {
  id: string;
  title: LocalizedText;
  playlist: LocalizedText;
  duration: string;
  thumbnail: string;
  youtubeUrl: string;
}

interface VideoTheaterProps {
  videos: VideoCardData[];
  lang: Language;
}

/**
 * Videos & podcasts explorer: playlist filter tabs, responsive card grid,
 * and a popup "theater" dialog per video with a YouTube deep-link CTA.
 */
export function VideoTheater({ videos, lang }: VideoTheaterProps) {
  const playlists = useMemo(() => {
    const seen: string[] = [];
    for (const video of videos) {
      if (!seen.includes(video.playlist.bn)) seen.push(video.playlist.bn);
    }
    return seen;
  }, [videos]);

  const [active, setActive] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (active === "all" ? videos : videos.filter((v) => v.playlist.bn === active)),
    [videos, active],
  );

  const openVideo = openId ? videos.find((v) => v.id === openId) ?? null : null;

  const gridId = "video-grid";

  return (
    <div>
      {/* ————— Playlist tabs ————— */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={lang === "bn" ? "প্লেলিস্ট" : "Playlists"}>
        <button
          type="button"
          role="tab"
          aria-selected={active === "all"}
          aria-controls={gridId}
          onClick={() => setActive("all")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-[13px] font-medium transition-all",
            active === "all"
              ? "bg-primary text-primary-foreground shadow-md"
              : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {lang === "bn" ? "সব প্লেলিস্ট" : "All playlists"}
          <span className="ml-1.5 opacity-70">{toBnDigits(videos.length)}</span>
        </button>
        {playlists.map((key) => {
          const label = pick(videos.find((v) => v.playlist.bn === key)?.playlist ?? { bn: key, en: key }, lang);
          const count = videos.filter((v) => v.playlist.bn === key).length;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              aria-controls={gridId}
              onClick={() => setActive(key)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 py-2 text-[13px] font-medium transition-all",
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

      {/* ————— Video cards ————— */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gold/40 bg-card/60 px-6 py-14 text-center">
          <span
            aria-hidden
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold"
          >
            <MonitorPlay className="h-7 w-7" />
          </span>
          <p className="font-heading text-base font-semibold text-foreground">
            {lang === "bn" ? "এই প্লেলিস্টে কোনো ভিডিও নেই" : "No videos in this playlist"}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {lang === "bn" ? "অন্য একটি প্লেলিস্ট বেছে নিন বা সব ভিডিও দেখুন।" : "Pick another playlist or browse everything."}
          </p>
        </div>
      ) : (
        <Stagger id={gridId} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((video) => (
            <RevealItem key={video.id}>
              <button
                type="button"
                onClick={() => setOpenId(video.id)}
                aria-haspopup="dialog"
                className="group w-full overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
              >
                <span className="relative block aspect-video overflow-hidden">
                  <img
                    src={video.thumbnail}
                    alt={pick(video.title, lang)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span aria-hidden className="absolute inset-0 bg-emerald-deep/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-14 w-14 text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110" />
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    <Clock3 aria-hidden className="h-3 w-3 text-gold" />
                    {video.duration}
                  </span>
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-primary backdrop-blur dark:bg-emerald-deep/90 dark:text-gold">
                    {pick(video.playlist, lang)}
                  </span>
                </span>
                <span className="block p-5">
                  <span className="font-heading block text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">
                    {pick(video.title, lang)}
                  </span>
                  <span className="mt-2 flex items-center gap-2 text-[12px] text-muted-foreground">
                    <Youtube aria-hidden className="h-3.5 w-3.5 text-gold" />
                    {lang === "bn" ? "ইউটিউবে দেখুন" : "Watch on YouTube"}
                  </span>
                </span>
              </button>
            </RevealItem>
          ))}
        </Stagger>
      )}

      {/* ————— Theater dialog ————— */}
      <Dialog open={openVideo !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        {openVideo ? (
          <DialogContent className="max-w-xl overflow-hidden p-0 sm:rounded-2xl">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={openVideo.thumbnail}
                alt={pick(openVideo.title, lang)}
                className="h-full w-full object-cover"
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                <PlayCircle className="h-20 w-20 animate-pulse text-white/95 drop-shadow-xl" />
              </span>
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white">
                <Clock3 aria-hidden className="h-3.5 w-3.5 text-gold" />
                {openVideo.duration}
              </span>
            </div>

            <div className="space-y-4 p-6">
              <DialogHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-gold/40 bg-gold/10 text-primary dark:text-gold">
                    {pick(openVideo.playlist, lang)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {lang === "bn" ? "ভিডিও ও পডকাস্ট" : "Video & podcast"}
                  </span>
                </div>
                <DialogTitle className="text-left font-heading text-lg leading-snug">
                  {pick(openVideo.title, lang)}
                </DialogTitle>
                <DialogDescription className="text-left">
                  {lang === "bn"
                    ? "আস-সুন্নাহ ফাউন্ডেশনের অফিসিয়াল ইউটিউব চ্যানেলে এই পর্বটি দেখুন ও শুনুন।"
                    : "Watch and listen to this episode on the official As-Sunnah Foundation YouTube channel."}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="gap-2 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90">
                  <a href={openVideo.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Youtube aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "YouTube-এ দেখুন" : "Watch on YouTube"}
                    <ExternalLink aria-hidden className="h-3.5 w-3.5 opacity-80" />
                  </a>
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="gap-2">
                    {lang === "bn" ? "বন্ধ করুন" : "Close"}
                  </Button>
                </DialogClose>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-3 text-[12px] leading-relaxed text-muted-foreground">
                <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                <span>
                  {lang === "bn"
                    ? "টিপ: চ্যানেলটি সাবস্ক্রাইব করলে নতুন পর্ব প্রকাশের সঙ্গে সঙ্গে নোটিফিকেশন পাবেন।"
                    : "Tip: subscribe to the channel to get notified the moment a new episode drops."}
                </span>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
