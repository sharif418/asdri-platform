"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarMotif } from "@/components/shared/ornaments";
import { youtubeEmbedUrl } from "@/lib/youtube";
import type { Language } from "@/types";

export interface HeroVideo {
  /** Canonical 11-char YouTube id (parsed at the source). */
  id: string;
  title: { bn: string; en: string };
}

interface HeroVideoDialogProps {
  lang: Language;
  /** Featured institute video to embed inside the dialog (null → static fallback). */
  video: HeroVideo | null;
  /** Institute YouTube channel URL (site settings). */
  youtubeUrl: string;
}

/**
 * The hero's only interactive piece: the intro-video trigger + dialog.
 * Everything else in the hero is a server component — this island is the
 * whole client-JS cost of the section, and the embed mounts only while the
 * dialog is open.
 */
export function HeroVideoDialog({ lang, video, youtubeUrl }: HeroVideoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Intro video trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hero-fade group mt-12 flex flex-col items-center gap-3"
        style={{ animationDelay: "0.55s" }}
      >
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 bg-white/10 backdrop-blur transition-all group-hover:scale-105 group-hover:border-gold group-hover:bg-white/20">
          <span
            aria-hidden
            className="absolute inset-0 animate-ping rounded-full border border-gold/40"
            style={{ animationDuration: "2.4s" }}
          />
          <Play aria-hidden className="h-6 w-6 fill-gold text-gold" />
        </span>
        <span className="text-sm font-medium text-ivory/85 transition-colors group-hover:text-gold">
          {lang === "bn" ? "পরিচিতিমূলক ভিডিও দেখুন" : "Watch Introductory Video"}
        </span>
      </button>

      {/* Video dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg border-emerald-800/40 bg-emerald-deep text-ivory sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2 text-left text-lg">
              <StarMotif className="h-4 w-4 text-gold" />
              {lang === "bn" ? "ইনস্টিটিউট পরিচিতি" : "About the Institute"}
            </DialogTitle>
            <DialogDescription className="text-left text-ivory/75">
              {lang === "bn"
                ? "ক্যাম্পাস লাইফ, দাওয়াহ কার্যক্রম ও ইনস্টিটিউটের লক্ষ্য নিয়ে আমাদের অফিসিয়াল ভিডিওগুলো দেখুন।"
                : "Watch our official videos showcasing campus life, dawah activities, and the institute's vision."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {/* The embed mounts only while the dialog is open (zero page cost
                until then; privacy-enhanced nocookie host; CSP allows it). */}
            {video ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-gold/30 bg-black">
                <iframe
                  src={youtubeEmbedUrl(video.id)}
                  title={lang === "bn" ? video.title.bn : video.title.en}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            ) : (
              <div className="relative w-full overflow-hidden rounded-lg border border-gold/30">
                <img
                  src="/images/campus-seminar.png"
                  alt={lang === "bn" ? "ইনস্টিটিউট সেমিনার" : "Institute seminar"}
                  className="aspect-video w-full object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-emerald-deep/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-emerald-deep/70 backdrop-blur">
                    <Play aria-hidden className="h-5 w-5 fill-gold text-gold" />
                  </span>
                </div>
              </div>
            )}
            <Button asChild variant="outline" className="w-full border-ivory/30 text-ivory hover:bg-white/10 hover:text-ivory">
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink aria-hidden className="h-4 w-4" />
                {lang === "bn" ? "YouTube চ্যানেলে আরও ভিডিও" : "More videos on YouTube"}
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
