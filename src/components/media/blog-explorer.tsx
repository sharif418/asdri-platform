"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, User } from "lucide-react";
import { pick, type Language, type LocalizedText } from "@/types";
import { formatDate, toBnDigits } from "@/lib/format";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

/** Card-shaped article projection passed from the server (no markdown body). */
export interface ArticleCardData {
  slug: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  category: LocalizedText;
  author: string;
  authorRole: LocalizedText;
  publishedAt: string;
  readMinutes: number;
  cover: string;
}

interface BlogExplorerProps {
  articles: ArticleCardData[];
  lang: Language;
}

/**
 * Blog index body: category filter chips + responsive article grid.
 * Pure client-side filtering over the serialized server list.
 */
export function BlogExplorer({ articles, lang }: BlogExplorerProps) {
  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const article of articles) {
      const key = article.category.bn;
      if (!seen.includes(key)) seen.push(key);
    }
    return seen;
  }, [articles]);

  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(
    () => (active === "all" ? articles : articles.filter((a) => a.category.bn === active)),
    [articles, active],
  );

  return (
    <div>
      {/* ————— Category chips ————— */}
      <div className="mb-10 flex flex-wrap items-center justify-center gap-2" role="tablist" aria-label={lang === "bn" ? "ক্যাটাগরি ফিল্টার" : "Category filter"}>
        <button
          type="button"
          role="tab"
          aria-selected={active === "all"}
          onClick={() => setActive("all")}
          className={cn(
            "rounded-full px-4 py-2 text-[13px] font-medium transition-all",
            active === "all"
              ? "bg-primary text-primary-foreground shadow-md"
              : "border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {lang === "bn" ? "সব প্রবন্ধ" : "All articles"}
          <span className="ml-1.5 opacity-70">{toBnDigits(articles.length)}</span>
        </button>
        {categories.map((key) => {
          const label = pick(
            articles.find((a) => a.category.bn === key)?.category ?? { bn: key, en: key },
            lang,
          );
          const count = articles.filter((a) => a.category.bn === key).length;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active === key}
              onClick={() => setActive(key)}
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

      {/* ————— Article cards ————— */}
      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          {lang === "bn" ? "এই ক্যাটাগরিতে কোনো প্রবন্ধ নেই।" : "No articles in this category."}
        </p>
      ) : (
        <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article, index) => (
            <RevealItem key={article.slug}>
              <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg">
                <Link href={`/media/blog/${article.slug}`} className="relative block aspect-[16/10] overflow-hidden" tabIndex={-1} aria-hidden>
                  <img
                    src={article.cover}
                    alt=""
                    loading={index < 3 ? "eager" : "lazy"}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-primary backdrop-blur dark:bg-emerald-deep/90 dark:text-gold">
                    {pick(article.category, lang)}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h2 className="font-heading text-lg font-semibold leading-snug">
                    <Link href={`/media/blog/${article.slug}`} className="link-sweep transition-colors hover:text-primary">
                      {pick(article.title, lang)}
                    </Link>
                  </h2>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {pick(article.excerpt, lang)}
                  </p>

                  <div className="mt-auto flex items-center gap-3 border-t pt-4">
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary"
                    >
                      {article.author.replace(/^(ড\.|মাওলানা|উস্তায|উস্তাজ|মুশফিকুর রহমান)\s*/u, "").slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 truncate text-[13px] font-semibold">
                        <User aria-hidden className="h-3 w-3 shrink-0 text-gold" />
                        {article.author}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{pick(article.authorRole, lang)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                      {formatDate(article.publishedAt, lang)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 font-semibold text-primary dark:text-gold">
                      <Clock3 aria-hidden className="h-3.5 w-3.5" />
                      {toBnDigits(article.readMinutes)} {lang === "bn" ? "মিনিট পাঠ" : "min read"}
                    </span>
                  </div>
                </div>
              </article>
            </RevealItem>
          ))}
        </Stagger>
      )}

      <Reveal className="mt-12 text-center text-sm text-muted-foreground">
        <p>
          {lang === "bn"
            ? "ইনস্টিটিউটের গবেষণা জার্নালে প্রকাশিত পূর্ণাঙ্গ প্রবন্ধসমূহ পেতে লাইব্রেরি পরিদর্শন করুন।"
            : "For full journal papers, visit the institute library section."}{" "}
          <Link href="/research/library" className="link-sweep inline-flex items-center gap-1 font-semibold text-primary">
            {lang === "bn" ? "লাইব্রেরি ও জার্নাল" : "Library & Journals"}
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </p>
      </Reveal>
    </div>
  );
}
