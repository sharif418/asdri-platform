import { getLang } from "@/lib/i18n-server";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NoticeComposer } from "@/components/admin/notice-composer";

export const metadata = { title: "নতুন নোটিশ" };

/** /admin/notices/new — create a fresh bilingual notice (admin-only via layout). */
export default async function AdminNoticeNewPage() {
  const lang = await getLang();
  const bn = lang === "bn";

  return (
    <>
      <AdminPageHeader
        eyebrow={bn ? "নোটিশ ব্যবস্থাপনা" : "Notice Management"}
        title={bn ? "নতুন নোটিশ তৈরি করুন" : "Create a Notice"}
        description={
          bn
            ? "বাংলা ও ইংরেজি — দুই ভাষাতেই শিরোনাম ও সারসংক্ষেপ পূরণ করুন। সংরক্ষণের সাথে সাথেই এটি প্রকাশ্য নোটিশ বোর্ডে চলে যাবে।"
            : "Fill in the Bengali and English title and excerpt. Saving publishes it to the public board instantly."
        }
      />
      <NoticeComposer lang={lang} mode="create" />
    </>
  );
}
