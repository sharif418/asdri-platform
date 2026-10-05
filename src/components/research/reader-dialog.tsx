"use client";

import { useState } from "react";
import { BookOpenText, Check, Download, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { pick } from "@/types";
import type { Language, LocalizedText } from "@/types";

interface ReaderDialogProps {
  title: LocalizedText;
  issnIsbn: string | null;
  year: number;
  lang: Language;
}

/**
 * The "reader" — an elegant dialog describing the embedded PDF viewer
 * (page navigator, zoom, full-text search, offline reading) with
 * download & share actions on an institutional-pad styled preview.
 */
export function ReaderDialog({ title, issnIsbn, year, lang }: ReaderDialogProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const resolvedTitle = pick(title, lang);

  const features =
    lang === "bn"
      ? [
          "পৃষ্ঠা নেভিগেটর — এক ক্লিকে যেকোনো পৃষ্ঠায় যাতায়াত",
          "জুম নিয়ন্ত্রণ — আরবি টেক্সট ও ফুটনোট পড়ার জন্য প্রয়োজনমতো বড় করুন",
          "ফুল-টেক্সট সার্চ — জার্নালের ভেতরেই কী-ওয়ার্ড খুঁজুন",
          "অফলাইন রিডিং — ডাউনলোড করে ইন্টারনেট ছাড়াই পড়ুন",
        ]
      : [
          "Page navigator — jump to any page in one click",
          "Zoom control — enlarge Arabic text and footnotes as needed",
          "Full-text search — find keywords inside the journal",
          "Offline reading — download and read without internet",
        ];

  async function share() {
    const shareText = `${resolvedTitle} — ${lang === "bn" ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট" : "As-Sunnah Dawah & Research Institute"}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: resolvedTitle, text: shareText, url: window.location.href });
        return;
      } catch {
        // user dismissed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
      setCopied(true);
      toast({ title: t("action.copied") });
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  }

  function download() {
    const blob = new Blob(
      [
        `${resolvedTitle}\n${lang === "bn" ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিটিউট, ঢাকা" : "As-Sunnah Dawah & Research Institute, Dhaka"}\n${year}${issnIsbn ? `\n${issnIsbn}` : ""}\n\n${lang === "bn" ? "এই ডাউনলোডটি ডেমো সংস্করণ — মূল পিডিএফ ইনস্টিটিউট লাইব্রেরি থেকে সংগ্রহ করুন।" : "This is a demo download — collect the original PDF from the institute library."}`,
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-info.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast({
      title: t("action.download"),
      description: lang === "bn" ? "লাইব্রেরি তথ্য-ফাইলটি ডাউনলোড হয়েছে" : "Library info file downloaded",
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-3.5 text-[12px] font-semibold">
          <BookOpenText aria-hidden className="h-3.5 w-3.5 text-gold" />
          {lang === "bn" ? "রিডারে খুলুন" : "Open in Reader"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg overflow-hidden rounded-2xl p-0">
        {/* pad-styled header */}
        <div className="relative overflow-hidden bg-emerald-deep px-6 pb-8 pt-6 text-ivory">
          <div aria-hidden className="pattern-lattice-light absolute inset-0" />
          <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />
          <DialogHeader className="relative">
            <p dir="rtl" lang="ar" className="font-arabic text-lg text-gold/90">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <DialogTitle className="font-heading mt-2 text-left text-lg leading-snug text-ivory">
              {resolvedTitle}
            </DialogTitle>
            <DialogDescription className="text-left text-[12.5px] leading-relaxed text-ivory/70">
              {lang === "bn"
                ? "ইনস্টিটিউট ডিজিটাল রিডার — এমবেডেড পিডিএফ ভিউয়ার"
                : "Institute Digital Reader — embedded PDF viewer"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* reader mock canvas */}
        <div className="relative mx-6 mt-[-18px] overflow-hidden rounded-xl border bg-card p-5 shadow-lg">
          <div aria-hidden className="pointer-events-none select-none">
            <div className="flex items-center justify-between border-b pb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span>{issnIsbn ?? (lang === "bn" ? "প্রকাশনা" : "Publication")} · {year}</span>
              <span>{lang === "bn" ? "পিডিএফ প্রিভিউ" : "PDF Preview"}</span>
            </div>
            <div className="mt-4 space-y-2.5" aria-hidden>
              <div className="h-2.5 w-3/4 rounded bg-muted" />
              <div className="h-2.5 w-full rounded bg-muted/80" />
              <div className="h-2.5 w-5/6 rounded bg-muted/70" />
              <p dir="rtl" lang="ar" className="font-arabic pt-2 text-right text-base leading-relaxed text-foreground/70">
                وَمَا اخْتَلَفْتُمْ فِيهِ مِنْ شَيْءٍ فَحُكْمُهُ إِلَى اللَّهِ
              </p>
              <div className="h-2.5 w-2/3 rounded bg-muted/60" />
              <div className="h-2.5 w-4/5 rounded bg-muted/50" />
            </div>
          </div>

          <ul className="mt-5 grid gap-2 border-t pt-4">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                <Sparkles aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex flex-col gap-2 border-t px-6 py-5 sm:flex-row">
          <Button
            type="button"
            onClick={download}
            className="gap-1.5 bg-primary font-semibold hover:bg-primary/90"
          >
            <Download aria-hidden className="h-4 w-4" />
            {lang === "bn" ? "ডাউনলোড" : "Download"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={share}
            className="gap-1.5 border-gold/50 font-semibold text-gold hover:bg-gold hover:text-gold-foreground"
          >
            {copied ? <Check aria-hidden className="h-4 w-4" /> : <Share2 aria-hidden className="h-4 w-4" />}
            {t("label.share")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
