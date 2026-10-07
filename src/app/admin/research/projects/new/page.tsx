import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ResearchProjectForm } from "@/components/admin/research-project-form";

export const metadata = { title: "নতুন গবেষণা প্রকল্প" };

/** New research project. */
export default async function NewResearchProjectPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/research/projects" className="hover:text-primary">
          গবেষণা প্রকল্প
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">নতুন প্রকল্প</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <FlaskConical aria-hidden className="h-6 w-6 text-primary" />
        নতুন গবেষণা প্রকল্প
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        অগ্রগতি, পর্যায় ও কল-ফর-পেপার্স তথ্য পরে যেকোনো সময় হালনাগাদ করা যায়।
      </p>
      <ResearchProjectForm
        mode="create"
        initial={{
          titleBn: "",
          titleEn: "",
          summaryBn: "",
          summaryEn: "",
          progress: 0,
          statusBn: "",
          statusEn: "",
          isCallForPapers: false,
          deadline: "",
          isPublished: true,
          sortOrder: 0,
        }}
      />
    </div>
  );
}
