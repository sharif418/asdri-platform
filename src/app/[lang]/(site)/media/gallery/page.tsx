import type { Metadata } from "next";
import { langPath, type Lang } from "@/lib/locale";
import { toBnDigits } from "@/lib/format";
import { galleryPhotos } from "@/content/media";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { GalleryExplorer } from "@/components/media/gallery-explorer";
import { GoldRule } from "@/components/shared/ornaments";

export const metadata: Metadata = {
  title: "ফটো গ্যালারি | আস-সুন্নাহ ইনস্টিটিউট",
  description:
    "ক্যাম্পাস ও লাইব্রেরি, সেমিনার ও সমাবেশ, দাওয়াহ ফিল্ডওয়ার্ক ও আযান প্রশিক্ষণের মুহূর্তগুলো অ্যালবামভিত্তিক ফটো সংগ্রহে।",
};

export default async function GalleryPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  const photos = galleryPhotos.map((photo) => ({
    src: photo.src,
    alt: photo.alt,
    caption: photo.caption,
    album: photo.album,
  }));

  const albumCount = new Set(galleryPhotos.map((photo) => photo.album.bn)).size;

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "মিডিয়া", en: "Media" }}
        title={{ bn: "ফটো গ্যালারি", en: "Photo Gallery" }}
        description={{
          bn: "ক্যাম্পাস-জীবনের প্রতিটি মুহূর্ত — ক্লিক করে বড় করে দেখুন, কীবোর্ডের তীর চিহ্নে ঘুরে দেখুন পুরো অ্যালবাম।",
          en: "Every campus moment — click to enlarge, browse whole albums with your arrow keys.",
        }}
        breadcrumb={[
          { label: { bn: "মিডিয়া", en: "Media" }, href: langPath(lang, "/media") },
          { label: { bn: "গ্যালারি", en: "Gallery" } },
        ]}
        arabicEcho="وَقُل رَّبِّ زِدْنِي عِلْمًا"
      />

      <section className="bg-parchment py-14 sm:py-20">
        <div className="container-site">
          <Reveal className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === "bn"
                ? `${toBnDigits(galleryPhotos.length)} টি ছবি · ${toBnDigits(albumCount)} টি অ্যালবাম`
                : `${galleryPhotos.length} photos · ${albumCount} albums`}
            </p>
          </Reveal>
          <GalleryExplorer photos={photos} lang={lang} />
          <GoldRule className="mt-14" />
        </div>
      </section>
    </>
  );
}
