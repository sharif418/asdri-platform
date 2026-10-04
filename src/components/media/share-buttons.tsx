"use client";

import { useState } from "react";
import { Check, Copy, Facebook, Link2, MessageCircle, Twitter } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import type { LocalizedText } from "@/types";
import { pick } from "@/types";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  title: LocalizedText | string;
  path: string;
}

interface ShareTarget {
  id: string;
  label: LocalizedText;
  icon: typeof Facebook;
  className: string;
  build: (url: string, text: string) => string;
}

const TARGETS: ShareTarget[] = [
  {
    id: "facebook",
    label: { bn: "ফেসবুক", en: "Facebook" },
    icon: Facebook,
    className: "hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white",
    build: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    label: { bn: "হোয়াটসঅ্যাপ", en: "WhatsApp" },
    icon: MessageCircle,
    className: "hover:bg-[#25D366] hover:border-[#25D366] hover:text-white",
    build: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} — ${url}`)}`,
  },
  {
    id: "x",
    label: { bn: "এক্স (টুইটার)", en: "X (Twitter)" },
    icon: Twitter,
    className: "hover:bg-black hover:border-black hover:text-white dark:hover:bg-white dark:hover:text-black",
    build: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
];

/** Social share row — resolves the absolute URL on click (SSR-safe). */
export function ShareButtons({ title, path }: ShareButtonsProps) {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const titleText = typeof title === "string" ? title : pick(title, lang);

  function openShare(build: (url: string, text: string) => string): void {
    const url = `${window.location.origin}${path}`;
    window.open(build(url, titleText), "_blank", "noopener,noreferrer,width=680,height=560");
  }

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      toast({ title: t("action.copied") });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-muted-foreground">{t("label.share")}:</span>
      {TARGETS.map((target) => {
        const Icon = target.icon;
        return (
          <button
            key={target.id}
            type="button"
            onClick={() => openShare((url, text) => target.build(url, text))}
            aria-label={`${t("label.share")} — ${pick(target.label, lang)}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-[13px] font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5",
              target.className,
            )}
          >
            <Icon aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">{pick(target.label, lang)}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => void copyLink()}
        aria-label={t("action.copy")}
        className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-2 text-[13px] font-medium text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gold/20 dark:text-gold"
      >
        {copied ? <Check aria-hidden className="h-4 w-4" /> : <Link2 aria-hidden className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? t("action.copied") : t("action.copy")}</span>
      </button>
    </div>
  );
}
