import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "পোস্ট সম্পাদনা" };

/** ISO → datetime-local input value (YYYY-MM-DDTHH:mm). */
function toLocalInput(iso: Date | null): string {
  if (!iso) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${iso.getFullYear()}-${pad(iso.getMonth() + 1)}-${pad(iso.getDate())}T${pad(iso.getHours())}:${pad(iso.getMinutes())}`;
}

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  const { slug } = await params;
  const [post, categories, authorRows] = await Promise.all([
    db.post.findUnique({
      where: { slug },
      include: { coverMedia: { select: { id: true, filename: true, key: true, width: true, height: true, size: true } } },
    }),
    db.postCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } }),
    // খেতাব/দল সহ — একই নামের একাধিক শিক্ষক আলাদা করতে অপশন লেবেলে পদবি যোগ হয় (r4 M14)।
    db.person.findMany({
      orderBy: [{ teamId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, nameBn: true, titleBn: true, team: { select: { nameBn: true } } },
    }),
  ]);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/blog" className="hover:text-primary">ব্লগ ও আর্টিকেল</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 truncate text-2xl font-bold">
        <PenLine aria-hidden className="h-6 w-6 shrink-0 text-primary" />
        {post.titleBn}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয়। মূল লেখা বদলালে পড়ার সময় নতুন করে হিসাব হয়।
      </p>
      <PostForm
        mode="edit"
        categories={categories}
        authors={authorRows.map((person) => ({
          id: person.id,
          nameBn: person.nameBn,
          titleBn: person.titleBn,
          teamNameBn: person.team?.nameBn ?? null,
        }))}
        initial={{
          id: post.id,
          slug: post.slug,
          titleBn: post.titleBn,
          titleEn: post.titleEn,
          excerptBn: post.excerptBn,
          excerptEn: post.excerptEn,
          bodyBn: post.bodyBn,
          bodyEn: post.bodyEn,
          kind: post.kind,
          categoryId: post.categoryId ?? "",
          authorId: post.authorId ?? "",
          isPublished: post.isPublished,
          publishedAt: toLocalInput(post.publishedAt),
          cover: post.coverMedia
            ? {
                id: post.coverMedia.id,
                filename: post.coverMedia.filename,
                key: post.coverMedia.key,
                width: post.coverMedia.width,
                height: post.coverMedia.height,
                size: post.coverMedia.size,
              }
            : null,
        }}
      />
    </div>
  );
}
