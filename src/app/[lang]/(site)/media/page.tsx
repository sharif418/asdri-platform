import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight, Clock3, Images, Newspaper, PenLine, PlayCircle, Youtube } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { pick, type LocalizedText } from "@/types";
import { formatDate, toBnDigits } from "@/lib/format";
import { getBlogArticles } from "@/lib/content/blog";
import { getNewsItems, getVideos, getAlbums } from "@/lib/content/media";
import { getSiteConfig } from "@/lib/content/site";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { GoldRule, StarMotif } from "@/components/shared/ornaments";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "মিডিয়া হাব | আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
  description:
    "গবেষণামূলক ব্লগ, ভিডিও ও পডকাস্ট, সংবাদ ও ইভেন্ট, ফটো গ্যালারি — ইনস্টিটিউটের সকল মিডিয়া এক কেন্দ্রে।",
};

interface HubCard {
  href: string;
  icon: typeof PenLine;
  title: LocalizedText;
  description: LocalizedText;
  stat: string;
  statLabel: LocalizedText;
  images: string[];
  alt: LocalizedText;
  cta: LocalizedText;
  tone: "emerald" | "parchment";
}

export default async function MediaHubPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const [blogArticles, newsItems, videos, galleryPhotos, siteConfig] = await Promise.all([
    getBlogArticles(),
    getNewsItems(),
    getVideos(),
    getAlbums(),
    getSiteConfig(),
  ]);

  const latest = blogArticles[0] ?? null;
  const upcomingCount = newsItems.filter((n) => n.upcoming).length;
  const videoCount = videos.length;
  const galleryCount = galleryPhotos.length;

  const cards: HubCard[] = [
    {
      href: "/media/blog",
      icon: PenLine,
      title: { bn: "ব্লগ ও প্রবন্ধ", en: "Blog & Articles" },
      description: {
        bn: "সমকালীন ফিতনা, দর্শন ও গবেষণা-পদ্ধতি বিষয়ে ইনস্টিটিউটের গবেষকদের লেখা গভীর প্রামাণ্য প্রবন্ধ।",
        en: "In-depth evidenced essays by the institute's researchers on contemporary fitnah, philosophy, and methodology.",
      },
      stat: lang === "bn" ? toBnDigits(blogArticles.length) : String(blogArticles.length),
      statLabel: { bn: "টি প্রকাশিত প্রবন্ধ", en: "published essays" },
      images: [latest?.cover, blogArticles[1]?.cover, blogArticles[3]?.cover].filter((src): src is string => Boolean(src)),
      alt: { bn: "সর্বশেষ ব্লগ প্রবন্ধের প্রচ্ছদ", en: "Latest blog article covers" },
      cta: { bn: "প্রবন্ধ পড়ুন", en: "Read articles" },
      tone: "parchment",
    },
    {
      href: "/media/videos",
      icon: PlayCircle,
      title: { bn: "ভিডিও ও পডকাস্ট", en: "Videos & Podcasts" },
      description: {
        bn: "সংক্ষিপ্ত সংশয় নিরসন, পডকাস্ট সিরিজ, লেকচার ও খুতবা এবং সেমিনার রেকর্ডিংস।",
        en: "Quick doubt-resolution clips, podcast series, lectures & khutbah, and seminar recordings.",
      },
      stat: lang === "bn" ? toBnDigits(videoCount) : String(videoCount),
      statLabel: { bn: "টি প্লেলিস্ট ভিডিও", en: "playlist videos" },
      images: [videos[0]?.thumbnail, videos[2]?.thumbnail, videos[3]?.thumbnail].filter((src): src is string => Boolean(src)),
      alt: { bn: "ভিডিও থাম্বনেইল", en: "Video thumbnails" },
      cta: { bn: "ভিডিও দেখুন", en: "Watch videos" },
      tone: "emerald",
    },
    {
      href: "/media/news",
      icon: Newspaper,
      title: { bn: "সংবাদ ও ইভেন্ট", en: "News & Events" },
      description: {
        bn: "আসন্ন অনুষ্ঠানের ঘোষণা, কাউন্টডাউন ও অতীত ইভেন্টের পূর্ণাঙ্গ প্রতিবেদন।",
        en: "Upcoming event announcements with countdown and full reports of past events.",
      },
      stat: lang === "bn" ? toBnDigits(upcomingCount) : String(upcomingCount),
      statLabel: { bn: "টি আসন্ন ইভেন্ট", en: "upcoming events" },
      images: [newsItems[1]?.cover, newsItems[3]?.cover, newsItems[0]?.cover].filter((src): src is string => Boolean(src)),
      alt: { bn: "ইভেন্টের প্রচ্ছদ চিত্র", en: "Event cover images" },
      cta: { bn: "সংবাদ দেখুন", en: "View news" },
      tone: "parchment",
    },
    {
      href: "/media/gallery",
      icon: Images,
      title: { bn: "ফটো গ্যালারি", en: "Photo Gallery" },
      description: {
        bn: "ক্যাম্পাস, সেমিনার, ফিল্ডওয়ার্ক ও প্রশিক্ষণের মুহূর্তগুলো — অ্যালবামভিত্তিক সাজানো ফটো সংগ্রহ।",
        en: "Campus, seminars, fieldwork, and training moments — organized photo albums.",
      },
      stat: lang === "bn" ? toBnDigits(galleryCount) : String(galleryCount),
      statLabel: { bn: "টি ফটো", en: "photos" },
      images: [galleryPhotos[2]?.src, galleryPhotos[1]?.src, galleryPhotos[0]?.src].filter((src): src is string => Boolean(src)),
      alt: { bn: "গ্যালারি ফটো", en: "Gallery photos" },
      cta: { bn: "গ্যালারি খুলুন", en: "Open gallery" },
      tone: "emerald",
    },
  ];

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "মিডিয়া ও রিসোর্স", en: "Media & Resources" }}
        title={{ bn: "মিডিয়া হাব", en: "Media Hub" }}
        description={{
          bn: "লেখা, ভিডিও, সংবাদ ও চিত্র — দাওয়াহ ও গবেষণার কাজের সম্পূর্ণ সংগ্রহ এক জায়গায়। যে কোনো মাধ্যমে প্রবেশ করুন।",
          en: "Writing, video, news, and imagery — the complete record of our dawah and research work. Enter through any medium.",
        }}
        breadcrumb={[{ label: { bn: "মিডিয়া", en: "Media" } }]}
        arabicEcho="وَقُل رَّبِّ زِدْنِي عِلْمًا"
      />

      {/* ————— Overview cards ————— */}
      <section className="bg-parchment py-16 sm:py-24">
        <div className="container-site">
          <Stagger className="grid gap-6 md:grid-cols-2">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <RevealItem key={card.href}>
                  <Link
                    href={langPath(lang, card.href)}
                    className={cn(
                      "group relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
                      card.tone === "emerald"
                        ? "border-emerald-deep/20 bg-emerald-deep text-ivory"
                        : "border-border bg-card text-foreground",
                    )}
                  >
                    {/* imagery collage */}
                    <div className="relative h-44 overflow-hidden sm:h-52">
                      <img
                        src={card.images[0]}
                        alt={pick(card.alt, lang)}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div
                        aria-hidden
                        className={cn(
                          "absolute inset-0",
                          card.tone === "emerald"
                            ? "bg-gradient-to-t from-emerald-deep via-emerald-deep/30 to-transparent"
                            : "bg-gradient-to-t from-card via-black/10 to-transparent",
                        )}
                      />
                      <img
                        src={card.images[1]}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="absolute bottom-3 right-14 h-20 w-32 rounded-lg border-2 border-white/70 object-cover shadow-md transition-transform duration-500 group-hover:-translate-y-1"
                      />
                      <img
                        src={card.images[2]}
                        alt=""
                        aria-hidden
                        loading="lazy"
                        className="absolute bottom-3 right-3 h-20 w-32 rounded-lg border-2 border-white/70 object-cover shadow-md transition-transform duration-500 group-hover:-translate-y-2"
                      />
                      <div className={cn("absolute left-4 top-4 rounded-xl p-2.5 shadow-lg", card.tone === "emerald" ? "bg-emerald-deep/85 text-gold backdrop-blur" : "bg-white/85 text-primary backdrop-blur")}>
                        <Icon aria-hidden className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                      <div className="flex items-center gap-3">
                        <h2 className={cn("font-heading text-xl font-semibold sm:text-2xl", card.tone === "emerald" ? "text-ivory" : "text-foreground")}>
                          {pick(card.title, lang)}
                        </h2>
                        <ArrowUpRight
                          aria-hidden
                          className={cn(
                            "ml-auto h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1",
                            card.tone === "emerald" ? "text-gold" : "text-gold",
                          )}
                        />
                      </div>
                      <p className={cn("text-sm leading-relaxed", card.tone === "emerald" ? "text-ivory/75" : "text-muted-foreground")}>
                        {pick(card.description, lang)}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1.5 border-gold/40 px-3 py-1 text-xs font-semibold",
                            card.tone === "emerald" ? "bg-gold/15 text-gold" : "bg-gold/10 text-primary",
                          )}
                        >
                          <span className="font-heading text-base leading-none">{card.stat}</span>
                          {pick(card.statLabel, lang)}
                        </Badge>
                        <span
                          className={cn(
                            "link-sweep inline-flex items-center gap-1.5 text-sm font-semibold",
                            card.tone === "emerald" ? "text-gold" : "text-primary",
                          )}
                        >
                          {pick(card.cta, lang)}
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </RevealItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ————— Latest writings + channel CTA ————— */}
      <section className="py-16 sm:py-24">
        <div className="container-site">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                  {lang === "bn" ? "সদ্য-প্রকাশিত" : "Fresh off the press"}
                </p>
                <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                  {lang === "bn" ? "সর্বশেষ গবেষণা-প্রবন্ধ" : "Latest research essays"}
                </h2>
              </div>
              <Link
                href={langPath(lang, "/media/blog")}
                className="link-sweep inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
              >
                {lang === "bn" ? "সব প্রবন্ধ" : "All essays"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-6 lg:grid-cols-3">
            <Stagger className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
              {blogArticles.slice(0, 3).map((article) => (
                <RevealItem key={article.slug}>
                  <Link
                    href={langPath(lang, `/media/blog/${article.slug}`)}
                    className="group flex h-full flex-col rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
                  >
                    <h3 className="font-heading text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary">
                      {pick(article.title, lang)}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                      {pick(article.excerpt, lang)}
                    </p>
                    <div className="mt-auto flex items-center gap-2 pt-3 text-[12px] text-muted-foreground">
                      <Clock3 aria-hidden className="h-3.5 w-3.5 text-gold" />
                      {lang === "bn" ? toBnDigits(article.readMinutes) : article.readMinutes} {lang === "bn" ? "মিনিট" : "min"} · {formatDate(article.publishedAt, lang)}
                    </div>
                  </Link>
                </RevealItem>
              ))}
            </Stagger>

            <Reveal delay={0.15}>
              <a
                href={siteConfig.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-emerald-deep p-6 text-ivory shadow-lg"
              >
                <div aria-hidden className="pattern-lattice-light absolute inset-0" />
                <div className="relative">
                  <StarMotif className="mb-4 h-8 w-8 text-gold" />
                  <h3 className="font-heading text-xl font-semibold sm:text-2xl">
                    {lang === "bn" ? "ইউটিউব চ্যানেলে সাবস্ক্রাইব করুন" : "Subscribe on YouTube"}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ivory/75">
                    {lang === "bn"
                      ? "আস-সুন্নাহ ফাউন্ডেশনের অফিসিয়াল চ্যানেলে খুতবা, লেকচার ও পডকাস্ট — সবার আগে পান।"
                      : "Khutbah, lectures, and podcasts on the official As-Sunnah Foundation channel — get them first."}
                  </p>
                </div>
                <span className="relative inline-flex w-fit items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-gold-foreground transition-transform group-hover:scale-105">
                  <Youtube aria-hidden className="h-4 w-4" />
                  {lang === "bn" ? "চ্যানেল দেখুন" : "Visit channel"}
                </span>
              </a>
            </Reveal>
          </div>

          <GoldRule className="mt-14" />
        </div>
      </section>
    </>
  );
}
