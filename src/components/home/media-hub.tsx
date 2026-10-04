import Link from "next/link";
import { ArrowRight, Clock3, Newspaper, Images, PlayCircle, Youtube } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { blogArticles } from "@/content/blog";
import { galleryPhotos } from "@/content/media";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Language } from "@/types";
import { formatDate } from "@/lib/format";

/** Media & knowledge hub — latest articles, videos, gallery, journals. */
export function MediaHub({ lang }: { lang: Language }) {
  const latestArticles = blogArticles.slice(0, 3);
  const galleryPreview = galleryPhotos.slice(0, 5);

  return (
    <section className="bg-parchment py-16 sm:py-24 dark:bg-secondary/30">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "মিডিয়া হাব" : "Media Hub"}
            title={lang === "bn" ? "মিডিয়া ও জ্ঞানকেন্দ্র" : "Media & Knowledge Hub"}
            description={
              lang === "bn"
                ? "সর্বশেষ গবেষণা-প্রবন্ধ, ভিডিও-পডকাস্ট, ফটো গ্যালারি ও লাইব্রেরি প্রিভিউ — এক ঠিকানায়।"
                : "Latest research articles, videos & podcasts, photo gallery, and library previews — all in one place."
            }
            lang={lang}
          />
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Latest articles */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                <Newspaper aria-hidden className="h-4 w-4 text-gold" />
                {lang === "bn" ? "সর্বশেষ প্রবন্ধ" : "Latest Articles"}
              </h3>
              <Link href={langPath(lang, "/media/blog")} className="link-sweep inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                {lang === "bn" ? "সব লেখা" : "All articles"}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Stagger className="mt-4 space-y-4">
              {latestArticles.map((article) => (
                <RevealItem key={article.slug}>
                  <Link href={langPath(lang, `/media/blog/${article.slug}`)} className="group flex gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-gold/50 hover:shadow-md">
                    <div className="relative hidden w-28 shrink-0 overflow-hidden rounded-lg sm:block">
                      <img src={article.cover} alt={pick(article.title, lang)} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-gold">{pick(article.category, lang)}</span>
                      <h4 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">
                        {pick(article.title, lang)}
                      </h4>
                      <p className="mt-1.5 flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span>{article.author}</span>
                        <span className="flex items-center gap-1">
                          <Clock3 aria-hidden className="h-3 w-3" />
                          {lang === "bn" ? `${article.readMinutes} মিনিট` : `${article.readMinutes} min`}
                        </span>
                        <span>{formatDate(article.publishedAt, lang)}</span>
                      </p>
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </Stagger>

            {/* Videos strip */}
            <Reveal className="mt-6">
              <Link
                href={langPath(lang, "/media/videos")}
                className="group flex items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gradient-to-r from-emerald-deep to-emerald-800 p-5 text-ivory transition-all hover:shadow-lg hover:shadow-emerald-950/20"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold transition-transform group-hover:scale-110">
                    <PlayCircle aria-hidden className="h-7 w-7" />
                  </span>
                  <div>
                    <h4 className="font-heading text-[15px] font-semibold">
                      {lang === "bn" ? "ভিডিও ও পডকাস্ট" : "Videos & Podcasts"}
                    </h4>
                    <p className="text-[12px] text-ivory/70">
                      {lang === "bn"
                        ? "সংক্ষিপ্ত সংশয় নিরসন • পডকাস্ট সিরিজ • লেকচার ও খুতবা"
                        : "Quick responses • Podcast series • Lectures & khutbah"}
                    </p>
                  </div>
                </div>
                <Youtube aria-hidden className="h-6 w-6 text-gold/80 transition-colors group-hover:text-gold" />
              </Link>
            </Reveal>
          </div>

          {/* Gallery preview */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
                <Images aria-hidden className="h-4 w-4 text-gold" />
                {lang === "bn" ? "ফটো গ্যালারি" : "Photo Gallery"}
              </h3>
              <Link href={langPath(lang, "/media/gallery")} className="link-sweep inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                {lang === "bn" ? "সব ছবি" : "All photos"}
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Stagger className="mt-4 grid grid-cols-2 gap-3">
              {galleryPreview.map((photo, index) => (
                <RevealItem
                  key={photo.src}
                  className={index === 0 ? "col-span-2" : undefined}
                >
                  <Link href={langPath(lang, "/media/gallery")} className="group relative block overflow-hidden rounded-lg">
                    <img
                      src={photo.src}
                      alt={pick(photo.alt, lang)}
                      loading="lazy"
                      className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${index === 0 ? "aspect-[16/9]" : "aspect-square"}`}
                    />
                    <div aria-hidden className="absolute inset-0 bg-emerald-deep/0 transition-colors group-hover:bg-emerald-deep/30" />
                  </Link>
                </RevealItem>
              ))}
            </Stagger>

            {/* Library preview */}
            <Reveal className="mt-6">
              <Link
                href={langPath(lang, "/research/library")}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
              >
                <div>
                  <h4 className="text-[14px] font-semibold">{lang === "bn" ? "লাইব্রেরি ও জার্নাল" : "Library & Journals"}</h4>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {lang === "bn" ? "বার্ষিক জার্নাল ও প্রকাশনা প্রিভিউ" : "Annual journal & publication previews"}
                  </p>
                </div>
                <ArrowRight aria-hidden className="h-5 w-5 text-gold transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
