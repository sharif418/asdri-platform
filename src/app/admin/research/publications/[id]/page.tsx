import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { PublicationForm } from "@/components/admin/publication-form";
import type { PickedMedia } from "@/components/admin/ui/media-picker";

export const metadata = { title: "প্রকাশনা সম্পাদনা" };

function toPicked(media: { id: string; filename: string; key: string; width: number | null; height: number | null; size: number } | null): PickedMedia | null {
  return media ? { id: media.id, filename: media.filename, key: media.key, width: media.width, height: media.height, size: media.size } : null;
}

/** Edit an existing publication. */
export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const { id } = await params;
  const publication = await db.publication.findUnique({
    where: { id },
    include: {
      coverMedia: { select: { id: true, filename: true, key: true, width: true, height: true, size: true } },
      fileMedia: { select: { id: true, filename: true, key: true, width: true, height: true, size: true } },
    },
  });
  if (!publication) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/research/publications" className="hover:text-primary">
          জার্নাল ও বই
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <FileText aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        <span className="truncate" dir="auto">
          {publication.titleBn}
        </span>
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        স্লাগ <code className="rounded bg-secondary px-1" dir="ltr">{publication.slug}</code> — পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়।
      </p>
      <PublicationForm
        mode="edit"
        initialCover={toPicked(publication.coverMedia)}
        initialFile={toPicked(publication.fileMedia)}
        initial={{
          id: publication.id,
          titleBn: publication.titleBn,
          titleEn: publication.titleEn,
          abstractBn: publication.abstractBn,
          abstractEn: publication.abstractEn,
          authorsBn: publication.authorsBn,
          authorsEn: publication.authorsEn,
          kind: publication.kind,
          year: publication.year,
          isbn: publication.isbn ?? "",
          issn: publication.issn ?? "",
          sortOrder: publication.sortOrder,
          isPublished: publication.isPublished,
        }}
      />
    </div>
  );
}
