import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Images } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { AlbumForm } from "@/components/admin/album-form";
import { AlbumImagesManager, type AlbumImageRow } from "@/components/admin/album-images-manager";

export const metadata = { title: "অ্যালবাম সম্পাদনা" };

export default async function EditAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const { slug } = await params;
  const album = await db.album.findUnique({
    where: { slug },
    include: {
      coverMedia: { select: { id: true, filename: true, key: true, width: true, height: true, size: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, mediaId: true, captionBn: true, captionEn: true, sortOrder: true, media: { select: { key: true, filename: true } } },
      },
    },
  });
  if (!album) notFound();

  const imageRows: AlbumImageRow[] = album.images.map((image) => ({
    id: image.id,
    mediaId: image.mediaId,
    key: image.media.key,
    filename: image.media.filename,
    captionBn: image.captionBn,
    captionEn: image.captionEn,
    sortOrder: image.sortOrder,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/gallery" className="hover:text-primary">গ্যালারি</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Images aria-hidden className="h-6 w-6 text-primary" />
        {album.titleBn}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        অ্যালবামের তথ্য ও ছবি একসাথে সম্পাদনা করুন — পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়।
      </p>

      <div className="space-y-6">
        <AlbumForm
          mode="edit"
          initial={{
            id: album.id,
            slug: album.slug,
            titleBn: album.titleBn,
            titleEn: album.titleEn,
            descriptionBn: album.descriptionBn,
            descriptionEn: album.descriptionEn,
            isPublished: album.isPublished,
            sortOrder: album.sortOrder,
            cover: album.coverMedia
              ? {
                  id: album.coverMedia.id,
                  filename: album.coverMedia.filename,
                  key: album.coverMedia.key,
                  width: album.coverMedia.width,
                  height: album.coverMedia.height,
                  size: album.coverMedia.size,
                }
              : null,
          }}
        />
        <AlbumImagesManager key={imageRows.map((row) => `${row.id}:${row.sortOrder}`).join("|")} albumId={album.id} images={imageRows} />
      </div>
    </div>
  );
}
