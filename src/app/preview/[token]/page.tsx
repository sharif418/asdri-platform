import { EyeOff } from "lucide-react";
import { verifyPreviewToken } from "@/lib/preview-link";
import { getNoticeForPreview } from "@/lib/content/notices";
import { getPostForPreview } from "@/lib/content/blog";
import { getCourseForPreview } from "@/lib/content/courses";
import { pick } from "@/types";
import { PageHero } from "@/components/shared/page-hero";
import { NoticePad } from "@/components/notices/notice-pad";
import { PostArticleView } from "@/components/media/post-article-view";
import { CourseDetail } from "@/components/academics/course-detail";

export const dynamic = "force-dynamic";

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

/**
 * /preview/<token> — the signed, 24-hour preview link (round 4, workstream 5;
 * Course entity round 11). Renders a Notice, Post or Course (drafts included)
 * through the SAME public render path as its permalink: the shared
 * NoticePad / PostArticleView / CourseDetail components. Course previews
 * omit the apply CTA band + sidebar button — a draft must not invite
 * applications. No view counting, no OG article meta, no sitemap;
 * invalid/expired tokens all land on the same quiet "লিংকটি আর বৈধ নয়" state
 * as accept-invite.
 */
export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;
  const payload = verifyPreviewToken(token);

  if (!payload) return <UnavailableState />;

  if (payload.entity === "Notice") {
    const notice = await getNoticeForPreview(payload.entityId);
    if (!notice) return <UnavailableState />;
    return (
      <>
        <PreviewBanner />
        <main id="preview-main" className="flex-1">
          <PageHero
            lang="bn"
            eyebrow={{ bn: "দাপ্তরিক বিজ্ঞপ্তি", en: "Official Notice" }}
            title={notice.title}
            description={pick(notice.excerpt, "bn").trim() || undefined}
            breadcrumb={[{ label: { bn: "প্রিভিউ", en: "Preview" } }]}
          />
          <section className="bg-parchment pb-16 pt-8 sm:pb-20 sm:pt-12">
            <div className="container-site">
              <NoticePad notice={notice} lang="bn" />
            </div>
          </section>
        </main>
      </>
    );
  }

  if (payload.entity === "Course") {
    const course = await getCourseForPreview(payload.entityId);
    if (!course) return <UnavailableState />;
    return (
      <>
        <PreviewBanner />
        <main id="preview-main" className="flex-1">
          <CourseDetail course={course} lang="bn" withApplyBand={false} />
        </main>
      </>
    );
  }

  const post = await getPostForPreview(payload.entityId);
  if (!post) return <UnavailableState />;
  return (
    <>
      <PreviewBanner />
      <main id="preview-main" className="flex-1">
        <PageHero
          lang="bn"
          eyebrow={post.category}
          title={post.title}
          description={post.excerpt}
          breadcrumb={[{ label: { bn: "প্রিভিউ", en: "Preview" } }]}
        />
        <article className="bg-parchment pb-16 pt-10 sm:pt-14">
          <div className="container-site">
            <PostArticleView article={post} lang="bn" sharePath={null} backHref={null} />
          </div>
        </article>
      </main>
    </>
  );
}

/** Fixed gold banner — this is a draft, not the published page. */
function PreviewBanner() {
  return (
    <>
      {/* spacer so the fixed banner never covers the hero */}
      <div aria-hidden className="h-10 print:hidden" />
      <div className="fixed inset-x-0 top-0 z-50 print:hidden">
        <p className="flex h-10 items-center justify-center gap-2 bg-gold-gradient px-4 text-center text-[13px] font-bold text-gold-foreground shadow-md">
          <EyeOff aria-hidden className="h-4 w-4" />
          প্রিভিউ — প্রকাশিত হয়নি
        </p>
      </div>
    </>
  );
}

/** The quiet invalid/expired-token state (same shape as accept-invite). */
function UnavailableState() {
  return (
    <main id="preview-main" className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-gold/20 bg-card p-8 text-center shadow-xl">
        <h1 className="font-heading text-xl font-bold">লিংকটি আর বৈধ নয়</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          এই প্রিভিউ লিংকটি হয় মেয়াদ শেষ (২৪ ঘণ্টা), নয়তো বাতিল।
          নতুন লিংকের জন্য অ্যাডমিন ফর্ম থেকে আবার তৈরি করুন।
        </p>
      </div>
    </main>
  );
}
