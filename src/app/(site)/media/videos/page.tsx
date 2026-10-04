import type { Metadata } from "next";
import { Bell, Youtube } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { pick } from "@/types";
import { toBnDigits } from "@/lib/format";
import { videos } from "@/content/media";
import { siteConfig } from "@/content/site";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { VideoTheater } from "@/components/media/video-theater";
import { StarMotif } from "@/components/shared/ornaments";

export const metadata: Metadata = {
  title: "ভিডিও ও পডকাস্ট | আস-সুন্নাহ ইনস্টিটিউট",
  description:
    "সংক্ষিপ্ত সংশয় নিরসন, পডকাস্ট সিরিজ, লেকচার ও খুতবা, সেমিনার রেকর্ডিংস — আস-সুন্নাহ ফাউন্ডেশন চ্যানেলে।",
};

export default async function VideosPage() {
  const lang = await getLang();

  const cards = videos.map((video) => ({
    id: video.id,
    title: video.title,
    playlist: video.playlist,
    duration: video.duration,
    thumbnail: video.thumbnail,
    youtubeUrl: video.youtubeUrl,
  }));

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "মিডিয়া", en: "Media" }}
        title={{ bn: "ভিডিও ও পডকাস্ট", en: "Videos & Podcasts" }}
        description={{
          bn: "৫ মিনিটের সংক্ষিপ্ত সংশয় নিরসন থেকে ঘণ্টাব্যাপী সেমিনার — দাওয়াহ ও গবেষণার ওডিও-ভিজ্যুয়াল লাইব্রেরি।",
          en: "From 5-minute doubt-resolution clips to full-length seminars — the audio-visual library of dawah and research.",
        }}
        breadcrumb={[
          { label: { bn: "মিডিয়া", en: "Media" }, href: "/media" },
          { label: { bn: "ভিডিও ও পডকাস্ট", en: "Videos" } },
        ]}
        arabicEcho="فَاسْأَلُوا أَهْلَ الذِّكْرِ إِن كُنتُمْ لَا تَعْلَمُونَ"
      />

      <section className="bg-parchment py-14 sm:py-20">
        <div className="container-site">
          <Reveal className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === "bn"
                ? `${toBnDigits(videos.length)} টি নির্বাচিত কনটেন্ট — প্লেলিস্ট অনুযায়ী ছাঁকুন`
                : `${videos.length} featured items — filter by playlist`}
            </p>
          </Reveal>
          <VideoTheater videos={cards} lang={lang} />
        </div>
      </section>

      {/* ————— Channel subscribe CTA ————— */}
      <section className="py-14 sm:py-20">
        <div className="container-site">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-emerald-deep px-6 py-12 text-center text-ivory shadow-xl sm:px-12">
              <div aria-hidden className="pattern-lattice-light absolute inset-0" />
              <StarMotif aria-hidden className="absolute left-6 top-6 h-10 w-10 text-gold/25" />
              <StarMotif aria-hidden className="absolute bottom-6 right-6 h-10 w-10 text-gold/25" />

              <div className="relative mx-auto max-w-2xl">
                <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-gradient shadow-lg">
                  <Youtube aria-hidden className="h-8 w-8 text-gold-foreground" />
                </span>
                <h2 className="font-heading text-2xl font-semibold sm:text-3xl">
                  {lang === "bn"
                    ? "আস-সুন্নাহ ফাউন্ডেশন — অফিসিয়াল ইউটিউব চ্যানেল"
                    : "As-Sunnah Foundation — Official YouTube Channel"}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-ivory/75 sm:text-base">
                  {lang === "bn"
                    ? "জুমার খুতবা, লেকচার সিরিজ, পডকাস্ট ও সেমিনার — সব কনটেন্ট এক চ্যানেলে। সাবস্ক্রাইব করে বেল আইকন চাপুন, নতুন ভিডিওর ঘোষণা সবার আগে পান।"
                    : "Friday khutbah, lecture series, podcasts, and seminars — all on one channel. Subscribe and ring the bell to hear about new videos first."}
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={siteConfig.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-7 py-3 text-sm font-bold text-gold-foreground shadow-lg transition-transform hover:scale-105"
                  >
                    <Youtube aria-hidden className="h-5 w-5" />
                    {lang === "bn" ? "চ্যানেল সাবস্ক্রাইব করুন" : "Subscribe to the channel"}
                  </a>
                  <a
                    href={siteConfig.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ivory/25 px-6 py-3 text-sm font-semibold text-ivory transition-colors hover:border-gold hover:text-gold"
                  >
                    <Bell aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "ফেসবুকে ফলো করুন" : "Follow on Facebook"}
                  </a>
                </div>
                <p className="mt-6 text-xs text-ivory/50">
                  {pick(
                    {
                      bn: `ইনস্টিটিউটের ${toBnDigits(videos.length)}+ নির্বাচিত ভিডিও এই পেজে কিউরেট করা হয়েছে`,
                      en: `${videos.length}+ curated institute videos are featured on this page`,
                    },
                    lang,
                  )}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
