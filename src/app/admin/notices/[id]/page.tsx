import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { formatDate } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NoticeComposer } from "@/components/admin/notice-composer";
import type { NoticeFormValues } from "@/components/admin/admin-types";
import type { NoticeCategory, NoticeStatus } from "@/types";

export const metadata: Metadata = { title: "নোটিশ সম্পাদনা" };

/** /admin/notices/[id] — edit an existing notice (admin-only via layout). */
export default async function AdminNoticeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const bn = lang === "bn";

  const notice = await db.notice.findUnique({ where: { id } });
  if (!notice) notFound();

  const initialValues: NoticeFormValues = {
    titleBn: notice.titleBn,
    titleEn: notice.titleEn,
    excerptBn: notice.excerptBn,
    excerptEn: notice.excerptEn,
    bodyBn: notice.bodyBn,
    bodyEn: notice.bodyEn,
    category: notice.category as NoticeCategory,
    status: notice.status as NoticeStatus,
    attachmentUrl: notice.attachmentUrl ?? "",
    slug: notice.slug,
  };

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "নোটিশ ব্যবস্থাপনা" : "Notice Management"}
        title={bn ? "নোটিশ সম্পাদনা" : "Edit Notice"}
        description={bn ? "বিজ্ঞপ্তিটি হালনাগাদ করুন — পরিবর্তন সংরক্ষণ করলে প্রকাশ্য বোর্ডে সঙ্গে সঙ্গে দেখাবে।" : "Update this notice — changes go live on the public board immediately."}
      >
        <Link
          href={`/notices?notice=${notice.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
        >
          <ExternalLink aria-hidden className="h-4 w-4" />
          {bn ? "প্রকাশ্য সাইটে দেখুন" : "View live"}
        </Link>
      </AdminPageHeader>

      {/* Record meta */}
      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-card px-4 py-3 text-[12px] text-muted-foreground shadow-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays aria-hidden className="h-3.5 w-3.5 text-gold" />
          {bn ? "প্রকাশ:" : "Published:"} <span className="font-semibold text-foreground">{formatDate(notice.publishedAt, lang)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock aria-hidden className="h-3.5 w-3.5 text-gold" />
          {bn ? "সর্বশেষ হালনাগাদ:" : "Last updated:"}{" "}
          <span className="font-semibold text-foreground">{formatDate(notice.updatedAt, lang)}</span>
        </span>
        <span dir="ltr" className="font-mono text-[11px]">
          /{notice.slug}
        </span>
      </div>

      <NoticeComposer lang={lang} mode="edit" noticeId={notice.id} initialValues={initialValues} />
    </>
  );
}
