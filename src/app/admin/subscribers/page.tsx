import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SubscriberTable } from "@/components/admin/subscriber-table";
import type { AdminSubscriberRow } from "@/components/admin/subscriber-table";

export const metadata = { title: "নিউজলেটার সাবস্ক্রাইবার" };

/** /admin/subscribers — newsletter roster with search + CSV export (admin-only via layout). */
export default async function AdminSubscribersPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  const rows = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const subscribers: AdminSubscriberRow[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "নিউজলেটার" : "Newsletter"}
        title={bn ? "নিউজলেটার সাবস্ক্রাইবার" : "Newsletter Subscribers"}
        description={
          bn
            ? "সাপ্তাহিক আপডেট গ্রহণকারীদের তালিকা — অনুসন্ধান করুন, এক ক্লিকে সব ইমেইল কপি করুন বা CSV এক্সপোর্ট করে মেইলিং টুলে ব্যবহার করুন।"
            : "The weekly-update recipient list — search, copy every address in one click, or export a CSV for your mailing tool."
        }
      />
      <SubscriberTable rows={subscribers} lang={lang} />
    </>
  );
}
