import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FatwaModeration } from "@/components/admin/fatwa-moderation";
import type { AdminFatwaQuestionData } from "@/components/admin/admin-types";
import type { FatwaCategory } from "@/types";

export const metadata = { title: "ফতোয়া মডারেশন" };

/** /admin/fatwa — submitted question moderation queue (admin-only via layout). */
export default async function AdminFatwaPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  // Pending first, then answered, then published — newest within each group.
  const STATUS_ORDER: Record<string, number> = { pending: 0, answered: 1, published: 2 };
  const rows = (
    await db.fatwaQuestion.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    })
  ).sort((a, b) => (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3));

  const questions: AdminFatwaQuestionData[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    category: row.category as FatwaCategory,
    question: row.question,
    isPrivate: row.isPrivate,
    status: row.status === "published" ? "published" : row.status === "answered" ? "answered" : "pending",
    answer: row.answer,
    answeredAt: row.answeredAt ? row.answeredAt.toISOString() : null,
    publishedSlug: row.publishedSlug,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "গবেষণা বোর্ড" : "Research Board"}
        title={bn ? "ফতোয়া মডারেশন" : "Fatwa Moderation"}
        description={
          bn
            ? "ওয়েবসাইট থেকে জমা হওয়া প্রশ্নগুলো দেখুন ও গবেষণা বোর্ডের পক্ষ থেকে উত্তর লিখুন — প্রাইভেট প্রশ্নের উত্তর শুধু ইমেইলে যায়।"
            : "Review submitted questions and record the research board's answers — private answers are emailed only."
        }
      />
      <FatwaModeration questions={questions} lang={lang} />
    </>
  );
}
