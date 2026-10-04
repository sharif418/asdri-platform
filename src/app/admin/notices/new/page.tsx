import Link from "next/link";
import { Megaphone } from "lucide-react";
import { NoticeForm } from "@/components/admin/notice-form";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "নতুন নোটিশ" };

export default async function NewNoticePage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/notices" className="hover:text-primary">নোটিশ বোর্ড</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">নতুন নোটিশ</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Megaphone aria-hidden className="h-6 w-6 text-primary" />
        নতুন নোটিশ তৈরি
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        বাংলা ও ইংরেজি — দুই ভাষায় লিখুন। ইংরেজি খালি রাখলে বাংলা কনটেন্টই দুই ভাষায় দেখানো হবে।
      </p>
      <NoticeForm
        mode="create"
        initial={{
          titleBn: "",
          titleEn: "",
          excerptBn: "",
          excerptEn: "",
          bodyBn: "",
          bodyEn: "",
          category: "GENERAL",
          status: "NEW",
          pinned: false,
          isPublished: true,
        }}
      />
    </div>
  );
}
