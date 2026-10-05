import { redirect } from "next/navigation";
import { MessageCircleQuestion, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { FaqsManager } from "@/components/admin/faqs-manager";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "সচরাচর প্রশ্ন" };

/** FAQ manager — the /admissions/faq page content, grouped by category. */
export default async function AdminFaqsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const faqs = await db.faq.findMany({ orderBy: [{ categoryBn: "asc" }, { sortOrder: "asc" }] });
  const categories = [...new Set(faqs.map((faq) => faq.categoryBn || "সাধারণ"))];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <a href="/admin/content" className="hover:text-primary hover:underline">
          পেজ কনটেন্ট
        </a>
        <span aria-hidden>›</span>
        <span>সচরাচর প্রশ্ন</span>
      </div>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <MessageCircleQuestion aria-hidden className="h-6 w-6 text-primary" />
            সচরাচর প্রশ্ন
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {formatNumber(faqs.length, "bn")}টি প্রশ্নোত্তর · {formatNumber(categories.length, "bn")}টি ক্যাটাগরি —
            ভর্তি প্রশ্নোত্তর পেজে ক্যাটাগরি অনুযায়ী দেখায়।
          </p>
        </div>
      </div>

      <div className="mt-6">
        <FaqsManager faqs={faqs} />
      </div>
    </div>
  );
}
