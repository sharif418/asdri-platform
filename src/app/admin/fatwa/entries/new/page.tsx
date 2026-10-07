import Link from "next/link";
import { BookMarked } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FatwaEntryForm } from "@/components/admin/fatwa-entry-form";

export const metadata = { title: "নতুন ফতোয়া" };

/** New fatwa bank entry — direct authoring (without an inbox question). */
export default async function NewFatwaEntryPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "fatwa.read")) redirect("/admin");

  const categories = await db.fatwaCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/fatwa/entries" className="hover:text-primary">
          ফতোয়া ব্যাংক
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">নতুন ফতোয়া</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <BookMarked aria-hidden className="h-6 w-6 text-primary" />
        নতুন ফতোয়া যোগ করুন
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        ইনবক্সের জিজ্ঞাসা ছাড়াও সরাসরি ফতোয়া ব্যাংকে প্রশ্ন-উত্তর যোগ করা যায়।
      </p>
      <FatwaEntryForm
        mode="create"
        categories={categories}
        initial={{
          questionBn: "",
          questionEn: "",
          answerBn: "",
          answerEn: "",
          answeredBy: "গবেষণা বোর্ড, আস-সুন্নাহ ইনস্টিটিউট",
          categoryId: categories[0]?.id ?? "",
          isPublished: true,
        }}
      />
    </div>
  );
}
