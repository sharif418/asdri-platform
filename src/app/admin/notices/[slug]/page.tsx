import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { NoticeForm } from "@/components/admin/notice-form";
import { RevisionHistory } from "@/components/admin/revision-history";
import { getSession, roleCan } from "@/lib/auth";

export const metadata = { title: "নোটিশ সম্পাদনা" };

export default async function EditNoticePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const { slug } = await params;
  const notice = await db.notice.findUnique({ where: { slug } });
  if (!notice) notFound();

  // Revision count doubles as the history panel's refresh version — it bumps
  // with every save's router.refresh().
  const revisionCount = await db.contentRevision.count({
    where: { entity: "Notice", entityId: notice.id },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/notices" className="hover:text-primary">নোটিশ বোর্ড</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Megaphone aria-hidden className="h-6 w-6 text-primary" />
        নোটিশ সম্পাদনা
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয় — কে কখন কী বদলেছেন পরে দেখা যাবে।
      </p>
      <NoticeForm
        mode="edit"
        initial={{
          id: notice.id,
          slug: notice.slug,
          titleBn: notice.titleBn,
          titleEn: notice.titleEn,
          excerptBn: notice.excerptBn,
          excerptEn: notice.excerptEn,
          bodyBn: notice.bodyBn,
          bodyEn: notice.bodyEn,
          category: notice.category,
          status: notice.status,
          pinned: notice.pinned,
          isPublished: notice.isPublished,
        }}
      />
      <RevisionHistory entity="Notice" entityId={notice.id} version={revisionCount} />
    </div>
  );
}
