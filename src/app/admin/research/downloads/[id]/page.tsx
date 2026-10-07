import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { DownloadForm } from "@/components/admin/download-form";
import type { PickedMedia } from "@/components/admin/ui/media-picker";

export const metadata = { title: "ডাউনলোড আইটেম সম্পাদনা" };

/** Edit an existing download resource. */
export default async function EditDownloadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const { id } = await params;
  const [resource, courses, existingCategories] = await Promise.all([
    db.downloadResource.findUnique({
      where: { id },
      include: { fileMedia: { select: { id: true, filename: true, key: true, width: true, height: true, size: true } }, course: { select: { id: true } } },
    }),
    db.course.findMany({ select: { id: true, titleBn: true }, orderBy: { sortOrder: "asc" } }),
    db.downloadResource.findMany({ distinct: ["categoryBn", "categoryEn"], select: { categoryBn: true, categoryEn: true } }),
  ]);
  if (!resource) notFound();

  const file: PickedMedia | null = resource.fileMedia
    ? {
        id: resource.fileMedia.id,
        filename: resource.fileMedia.filename,
        key: resource.fileMedia.key,
        width: resource.fileMedia.width,
        height: resource.fileMedia.height,
        size: resource.fileMedia.size,
      }
    : null;

  const categorySet = new Map<string, { bn: string; en: string }>();
  for (const row of existingCategories) {
    categorySet.set(row.categoryBn, { bn: row.categoryBn, en: row.categoryEn });
  }
  categorySet.set(resource.categoryBn, { bn: resource.categoryBn, en: resource.categoryEn });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/research/downloads" className="hover:text-primary">
          ডাউনলোড আইটেম
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Download aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        <span className="truncate" dir="auto">
          {resource.titleBn}
        </span>
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        ক্যাটাগরি <span className="font-semibold text-foreground">{resource.categoryBn}</span> — পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়।
      </p>
      <DownloadForm
        mode="edit"
        initialFile={file}
        categories={[...categorySet.values()]}
        courses={courses}
        initial={{
          id: resource.id,
          titleBn: resource.titleBn,
          titleEn: resource.titleEn,
          descriptionBn: resource.descriptionBn,
          descriptionEn: resource.descriptionEn,
          categoryBn: resource.categoryBn,
          categoryEn: resource.categoryEn,
          courseId: resource.course?.id ?? "",
          sortOrder: resource.sortOrder,
          isPublished: resource.isPublished,
        }}
      />
    </div>
  );
}
