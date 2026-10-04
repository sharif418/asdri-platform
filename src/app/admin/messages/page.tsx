import { db } from "@/lib/db";
import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MessageInbox } from "@/components/admin/message-inbox";
import type { AdminContactMessageData } from "@/components/admin/admin-types";

export const metadata = { title: "যোগাযোগ বার্তাবক্স" };

/** /admin/messages — contact-form inbox with status workflow (admin-only via layout). */
export default async function AdminMessagesPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  const rows = await db.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const messages: AdminContactMessageData[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status === "replied" ? "replied" : row.status === "read" ? "read" : "new",
    createdAt: row.createdAt.toISOString(),
  }));

  const newCount = messages.filter((message) => message.status === "new").length;

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "যোগাযোগ" : "Engagement"}
        title={bn ? "যোগাযোগ বার্তাবক্স" : "Contact Inbox"}
        description={
          bn
            ? "“যোগাযোগ” ফর্ম থেকে আসা বার্তাগুলো পড়ুন, পঠিত/উত্তরপ্রাপ্ত চিহ্নিত করুন — ইমেইল ঠিকানায় ক্লিক করলেই সরাসরি উত্তর পাঠানো যাবে।"
            : "Read messages from the contact form and mark them read/replied — click an address to reply directly."
        }
      />
      <MessageInbox messages={messages} lang={lang} />
      <p className="sr-only" aria-live="polite">
        {bn ? `মোট ${messages.length} টি বার্তা, এর মধ্যে ${newCount} টি নতুন।` : `${messages.length} messages, ${newCount} new.`}
      </p>
    </>
  );
}
