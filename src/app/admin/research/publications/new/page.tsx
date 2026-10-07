import Link from "next/link";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PublicationForm } from "@/components/admin/publication-form";

export const metadata = { title: "নতুন প্রকাশনা" };

/** New publication — journal / book / bulletin / paper. */
export default async function NewPublicationPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/research/publications" className="hover:text-primary">
          জার্নাল ও বই
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">নতুন প্রকাশনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <FileText aria-hidden className="h-6 w-6 text-primary" />
        নতুন প্রকাশনা যোগ করুন
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        জার্নাল সংখ্যা, বই, বুলেটিন বা রিসার্চ পেপার — প্রচ্ছদ ও পিডিএফ মিডিয়া লাইব্রেরি থেকে সংযুক্ত হয়।
      </p>
      <PublicationForm
        mode="create"
        initialCover={null}
        initialFile={null}
        initial={{
          titleBn: "",
          titleEn: "",
          abstractBn: "",
          abstractEn: "",
          authorsBn: "",
          authorsEn: "",
          kind: "JOURNAL",
          year: new Date().getFullYear(),
          isbn: "",
          issn: "",
          sortOrder: 0,
          isPublished: true,
        }}
      />
    </div>
  );
}
