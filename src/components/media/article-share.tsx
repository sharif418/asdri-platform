"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Facebook, Link2, MessageCircle, Share2, Twitter, type LucideIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/components/providers/language-provider";
import type { DictionaryKey } from "@/lib/i18n";
import type { LocalizedText } from "@/types";
import { pick } from "@/types";
import { cn } from "@/lib/utils";

interface ArticleShareProps {
  title: LocalizedText | string;
  path: string;
}

type ShareTargetId = "facebook" | "whatsapp" | "x";

interface ShareTarget {
  id: ShareTargetId;
  labelKey: DictionaryKey;
  icon: LucideIcon;
  build: (url: string, title: string) => string;
}

/** Deep-link targets — no brand colors in the UI chrome; icons stay emerald, hovers gold. */
const TARGETS: ShareTarget[] = [
  {
    id: "facebook",
    labelKey: "article.facebook",
    icon: Facebook,
    build: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "whatsapp",
    labelKey: "article.whatsapp",
    icon: MessageCircle,
    build: (url, title) => `https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`,
  },
  {
    id: "x",
    labelKey: "article.x",
    icon: Twitter,
    build: (url, title) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
];

const POPUP_FEATURES = "noopener,noreferrer,width=620,height=580";

/** No-op subscription — the snapshot is read once per client render. */
const emptySubscribe = (): (() => void) => () => {};

/** Clipboard write with a legacy execCommand fallback (non-secure contexts). */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      // focus + full selection makes execCommand("copy") reliable across engines
      area.focus();
      area.select();
      area.setSelectionRange(0, text.length);
      const succeeded = document.execCommand("copy");
      document.body.removeChild(area);
      return succeeded;
    } catch {
      return false;
    }
  }
}

/**
 * Article share toolbar: native Web Share (when available), Facebook /
 * WhatsApp / X deep-link popups and copy-link with toast — the absolute
 * URL is resolved from window.location on click (dev-safe, no
 * metadataBase dependency).
 */
export function ArticleShare({ title, path }: ArticleShareProps) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  // Hydration-safe feature detection (server snapshot: false).
  const canNativeShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  const titleText = typeof title === "string" ? title : pick(title, lang);

  /** Absolute article URL, built client-side: correct protocol in dev and prod. */
  const articleUrl = useCallback(() => `${window.location.origin}${path}`, [path]);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  function openSharePopup(target: ShareTarget): void {
    const url = target.build(articleUrl(), titleText);
    window.open(url, "_blank", POPUP_FEATURES);
  }

  async function nativeShare(): Promise<void> {
    try {
      await navigator.share({ title: titleText, url: articleUrl() });
    } catch {
      // Share sheet dismissed — nothing to report.
    }
  }

  async function copyLink(): Promise<void> {
    const ok = await copyToClipboard(articleUrl());
    if (!ok) {
      toast({ title: t("toast.error"), variant: "destructive" });
      return;
    }
    toast({ title: t("article.linkCopied") });
    setCopied(true);
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopied(false), 2400);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2.5 text-sm font-semibold text-foreground">
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <Share2 className="h-4.5 w-4.5" />
        </span>
        {t("article.shareHeading")}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {canNativeShare ? (
          <button
            type="button"
            onClick={() => void nativeShare()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <Share2 aria-hidden className="h-4 w-4" />
            {t("label.share")}
          </button>
        ) : null}

        {TARGETS.map((target) => {
          const Icon = target.icon;
          return (
            <button
              key={target.id}
              type="button"
              onClick={() => openSharePopup(target)}
              aria-label={`${t("label.share")} — ${t(target.labelKey)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/30 bg-card px-4 py-2 text-[13px] font-medium text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/60 hover:bg-gold/10 hover:text-primary hover:shadow-md"
            >
              <Icon aria-hidden className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">{t(target.labelKey)}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => void copyLink()}
          aria-label={t("article.copyLink")}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
            copied
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-gold/50 bg-gold/10 text-primary hover:bg-gold/20 dark:text-gold",
          )}
        >
          {copied ? (
            <Check aria-hidden className="h-4 w-4" />
          ) : (
            <Link2 aria-hidden className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {copied ? t("article.linkCopied") : t("article.copyLink")}
          </span>
        </button>
      </div>
    </div>
  );
}
