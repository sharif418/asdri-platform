import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookMarked } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { FatwaEntryForm } from "@/components/admin/fatwa-entry-form";

export const metadata = { title: "ফতোয়া সম্পাদনা" };

/** Edit an existing fatwa bank entry. */
export default async function EditFatwaEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "fatwa.read")) redirect("/admin");

  const { id } = await params;
  const [entry, categories] = await Promise.all([
    db.fatwaEntry.findUnique({ where: { id }, include: { category: { select: { id: true } } } }),
    db.fatwaCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } }),
  ]);
  if (!entry) notFound();

  const categoryOptions = entry.category && !categories.some((c) => c.id === entry.category?.id)
    ? [...categories, { id: entry.category.id, nameBn: "বর্তমান ক্যাটাগরি" }]
    : categories;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/fatwa/entries" className="hover:text-primary">
          ফতোয়া ব্যাংক
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <BookMarked aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        <span className="truncate" dir="auto">
          {entry.questionBn}
        </span>
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        স্লাগ <code className="rounded bg-secondary px-1" dir="ltr">{entry.slug}</code> — পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়।
      </p>
      <FatwaEntryForm
        mode="edit"
        categories={categoryOptions}
        initial={{
          id: entry.id,
          slug: entry.slug,
          questionBn: entry.questionBn,
          questionEn: entry.questionEn,
          answerBn: entry.answerBn,
          answerEn: entry.answerEn,
          answeredBy: entry.answeredBy,
          categoryId: entry.category?.id ?? "",
          isPublished: entry.isPublished,
        }}
      />
    </div>
  );
}
