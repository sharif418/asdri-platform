import Link from "next/link";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DownloadForm } from "@/components/admin/download-form";

export const metadata = { title: "নতুন ডাউনলোড আইটেম" };

/** New download centre resource. */
export default async function NewDownloadPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const [courses, existingCategories] = await Promise.all([
    db.course.findMany({ select: { id: true, titleBn: true }, orderBy: { sortOrder: "asc" } }),
    db.downloadResource.findMany({ distinct: ["categoryBn", "categoryEn"], select: { categoryBn: true, categoryEn: true } }),
  ]);
  const categories = existingCategories.map((row) => ({ bn: row.categoryBn, en: row.categoryEn }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/research/downloads" className="hover:text-primary">
          ডাউনলোড আইটেম
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">নতুন আইটেম</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Download aria-hidden className="h-6 w-6 text-primary" />
        নতুন ডাউনলোড আইটেম
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        ফরম, সিলেবাস বা যেকোনো পিডিএফ — ফাইল মিডিয়া লাইব্রেরি থেকে সংযুক্ত হয়।
      </p>
      <DownloadForm
        mode="create"
        initialFile={null}
        categories={categories}
        courses={courses}
        initial={{
          titleBn: "",
          titleEn: "",
          descriptionBn: "",
          descriptionEn: "",
          categoryBn: "",
          categoryEn: "",
          courseId: "",
          sortOrder: 0,
          isPublished: true,
        }}
      />
    </div>
  );
}
