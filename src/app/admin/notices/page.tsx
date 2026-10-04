import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NoticeTable } from "@/components/admin/notice-table";
import type { AdminNoticeData } from "@/components/admin/admin-types";
import type { NoticeCategory, NoticeStatus } from "@/types";

export const metadata = { title: "নোটিশ ব্যবস্থাপনা" };

/** /admin/notices — full notice board management table (admin-only, gated by layout). */
export default async function AdminNoticesPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  // Pinned notices surface first (editorial priority), then newest.
  const rows = await db.notice.findMany({ orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }] });

  const notices: AdminNoticeData[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    titleBn: row.titleBn,
    titleEn: row.titleEn,
    category: row.category as NoticeCategory,
    status: row.status as NoticeStatus,
    pinned: row.pinned,
    publishedAt: row.publishedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "কনটেন্ট অপারেশন" : "Content Operations"}
        title={bn ? "নোটিশ ব্যবস্থাপনা" : "Notice Management"}
        description={
          bn
            ? "প্রকাশিত সব বিজ্ঞপ্তি এক জায়গায় — খুঁজুন, সম্পাদনা করুন, স্ট্যাটাস বদলান বা মুছে ফেলুন।"
            : "All published notices in one place — search, edit, change status, or remove."
        }
      />
      <NoticeTable notices={notices} lang={lang} />
    </>
  );
}
