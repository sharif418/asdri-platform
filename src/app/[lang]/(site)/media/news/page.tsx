import type { Metadata } from "next";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { pick } from "@/types";
import { formatDate, toBnDigits } from "@/lib/format";
import { newsItems } from "@/content/media";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { EventCountdown } from "@/components/media/event-countdown";
import { GoldRule } from "@/components/shared/ornaments";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "সংবাদ ও ইভেন্ট | আস-সুন্নাহ ইনস্টিটিউট",
  description:
    "আসন্ন অনুষ্ঠানের ঘোষণা, লাইভ কাউন্টডাউন এবং অতীত ইভেন্টের পূর্ণাঙ্গ প্রতিবেদন — সব সংবাদ এক জায়গায়।",
};

function remainingSeconds(targetIso: string): number {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.floor((target - Date.now()) / 1000));
}

export default async function NewsPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  const upcoming = newsItems.filter((item) => item.upcoming);
  const past = newsItems.filter((item) => !item.upcoming);
  const next = upcoming[0] ?? null;

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "মিডিয়া", en: "Media" }}
        title={{ bn: "সংবাদ ও ইভেন্ট", en: "News & Events" }}
        description={{
          bn: "চুক্তি স্বাক্ষর থেকে সমাপনী — ইনস্টিটিউটের প্রতিটি গুরুত্বপূর্ণ মুহূর্তের ঘোষণা ও প্রতিবেদন।",
          en: "From agreements to convocations — announcements and reports of every significant institute moment.",
        }}
        breadcrumb={[
          { label: { bn: "মিডিয়া", en: "Media" }, href: langPath(lang, "/media") },
          { label: { bn: "সংবাদ", en: "News" } },
        ]}
        arabicEcho="وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى"
      />

      {/* ————— Upcoming events ————— */}
      <section className="bg-parchment py-14 sm:py-20" aria-labelledby="upcoming-heading">
        <div className="container-site">
          <Reveal>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <Sparkles aria-hidden className="h-5 w-5" />
              </span>
              <div>
                <h2 id="upcoming-heading" className="font-heading text-2xl font-semibold sm:text-3xl">
                  {lang === "bn" ? "আসন্ন অনুষ্ঠান" : "Upcoming Events"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {lang === "bn"
                    ? `${toBnDigits(upcoming.length)} টি ইভেন্ট সামনে অপেক্ষা করছে`
                    : `${upcoming.length} events on the horizon`}
                </p>
              </div>
            </div>
          </Reveal>

          {next ? (
            <Reveal delay={0.05}>
              <div className="relative mb-6 overflow-hidden rounded-3xl bg-emerald-deep text-ivory shadow-xl">
                <img
                  src={next.cover}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-emerald-deep via-emerald-deep/85 to-emerald-deep/40" />
                <div className="relative grid gap-6 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div>
                    <Badge className="mb-3 gap-1.5 border-gold/40 bg-gold/15 text-gold hover:bg-gold/25">
                      <Sparkles aria-hidden className="h-3.5 w-3.5" />
                      {lang === "bn" ? "সবার কাছাকাছি ইভেন্ট" : "Next up"}
                    </Badge>
                    <h3 className="font-heading text-xl font-semibold leading-snug sm:text-2xl">
                      {pick(next.title, lang)}
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ivory/75">
                      {pick(next.excerpt, lang)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ivory/85">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays aria-hidden className="h-4 w-4 text-gold" />
                        {formatDate(next.date, lang)}
                      </span>
                      {next.location ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin aria-hidden className="h-4 w-4 text-gold" />
                          {pick(next.location, lang)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <EventCountdown
                    targetIso={next.date}
                    lang={lang}
                    initialSeconds={remainingSeconds(next.date)}
                    className="justify-self-start lg:justify-self-end"
                  />
                </div>
              </div>
            </Reveal>
          ) : null}

          <Stagger className="grid gap-6 md:grid-cols-2">
            {upcoming.map((item) => (
              <RevealItem key={item.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-md">
                  <div className="relative aspect-[16/8] overflow-hidden">
                    <img
                      src={item.cover}
                      alt={pick(item.title, lang)}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-gold-foreground shadow">
                      {lang === "bn" ? "আসন্ন" : "Upcoming"}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <h3 className="font-heading text-lg font-semibold leading-snug">{pick(item.title, lang)}</h3>
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{pick(item.excerpt, lang)}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t pt-3 text-[13px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
                        {formatDate(item.date, lang)}
                      </span>
                      {item.location ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin aria-hidden className="h-3.5 w-3.5 text-gold" />
                          {pick(item.location, lang)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              </RevealItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ————— Past events with reports ————— */}
      <section className="py-14 sm:py-20" aria-labelledby="past-heading">
        <div className="container-site">
          <Reveal>
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-gold/40" />
              <h2 id="past-heading" className="font-heading text-2xl font-semibold sm:text-3xl">
                {lang === "bn" ? "অতীত ইভেন্ট ও প্রতিবেদন" : "Past Events & Reports"}
              </h2>
              <span aria-hidden className="h-px flex-1 bg-gold/40" />
            </div>
          </Reveal>

          <div className="mx-auto max-w-3xl space-y-10">
            {past.map((item, index) => (
              <Reveal key={item.id} delay={index * 0.06}>
                <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                  <div className="relative aspect-[16/7] overflow-hidden">
                    <img
                      src={item.cover}
                      alt={pick(item.title, lang)}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-primary backdrop-blur dark:bg-emerald-deep/90 dark:text-gold">
                        {formatDate(item.date, lang)}
                      </span>
                      <h3 className="mt-2 font-heading text-lg font-semibold text-white drop-shadow sm:text-xl">
                        {pick(item.title, lang)}
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3 p-5 sm:p-6">
                    {item.location ? (
                      <p className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        <MapPin aria-hidden className="h-3.5 w-3.5 text-gold" />
                        {pick(item.location, lang)}
                      </p>
                    ) : null}
                    {item.body.map((paragraph, pIndex) => (
                      <p key={pIndex} className="text-sm leading-relaxed text-muted-foreground">
                        {pick(paragraph, lang)}
                      </p>
                    ))}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <GoldRule className="mt-14" />
        </div>
      </section>
    </>
  );
}
