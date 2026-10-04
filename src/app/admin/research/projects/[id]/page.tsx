import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FlaskConical } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { ResearchProjectForm } from "@/components/admin/research-project-form";

export const metadata = { title: "গবেষণা প্রকল্প সম্পাদনা" };

/** Date → "YYYY-MM-DD" for the <input type="date"> initial value. */
function toIsoDate(value: Date | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

/** Edit an existing research project. */
export default async function EditResearchProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const { id } = await params;
  const project = await db.researchProject.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/research/projects" className="hover:text-primary">
          গবেষণা প্রকল্প
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <FlaskConical aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        <span className="truncate" dir="auto">
          {project.titleBn}
        </span>
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        স্লাগ <code className="rounded bg-secondary px-1" dir="ltr">{project.slug}</code> — পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়।
      </p>
      <ResearchProjectForm
        mode="edit"
        initial={{
          id: project.id,
          titleBn: project.titleBn,
          titleEn: project.titleEn,
          summaryBn: project.summaryBn,
          summaryEn: project.summaryEn,
          progress: project.progress,
          statusBn: project.statusBn,
          statusEn: project.statusEn,
          isCallForPapers: project.isCallForPapers,
          deadline: toIsoDate(project.deadline),
          isPublished: project.isPublished,
          sortOrder: project.sortOrder,
        }}
      />
    </div>
  );
}
