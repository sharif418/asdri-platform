import type { Metadata } from "next";
import { langPath, type Lang } from "@/lib/locale";
import { blogArticles } from "@/content/blog";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal } from "@/components/shared/reveal";
import { BlogExplorer } from "@/components/media/blog-explorer";
import { toBnDigits } from "@/lib/format";

export const metadata: Metadata = {
  title: "ব্লগ ও প্রবন্ধ | আস-সুন্নাহ ইনস্টিটিউট",
  description:
    "সমকালীন ফিতনা ও সংশয় নিরসন, তুলনামূলক ধর্মতত্ত্ব, তাফসীর ও হাদীস গবেষণা — ইনস্টিটিউটের গবেষকদের প্রামাণ্য প্রবন্ধ।",
};

export default async function BlogIndexPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  const articles = blogArticles.map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    category: article.category,
    author: article.author,
    authorRole: article.authorRole,
    publishedAt: article.publishedAt,
    readMinutes: article.readMinutes,
    cover: article.cover,
  }));

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "মিডিয়া", en: "Media" }}
        title={{ bn: "ব্লগ ও প্রবন্ধ", en: "Blog & Articles" }}
        description={{
          bn: "সংশয় নিরসন থেকে পদ্ধতিগত গবেষণা — ইনস্টিটিউটের উস্তাজ ও গবেষকদের লেখা প্রামাণ্য প্রবন্ধের সংগ্রহ।",
          en: "From doubt resolution to research methodology — a collection of evidenced essays by the institute's ustaz and researchers.",
        }}
        breadcrumb={[
          { label: { bn: "মিডিয়া", en: "Media" }, href: langPath(lang, "/media") },
          { label: { bn: "ব্লগ", en: "Blog" } },
        ]}
        arabicEcho="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
      />

      <section className="bg-parchment py-14 sm:py-20">
        <div className="container-site">
          <Reveal className="mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              {lang === "bn"
                ? `মোট ${toBnDigits(blogArticles.length)} টি গবেষণা-প্রবন্ধ — ক্যাটাগরি অনুযায়ী ছাঁকুন`
                : `${blogArticles.length} research essays — filter by category`}
            </p>
          </Reveal>
          <BlogExplorer articles={articles} lang={lang} />
        </div>
      </section>
    </>
  );
}
