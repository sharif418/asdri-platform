import Link from "next/link";
import { PenLine } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";

export const metadata = { title: "নতুন পোস্ট" };

export default async function NewPostPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content")) redirect("/admin");

  const [categories, authors] = await Promise.all([
    db.postCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } }),
    // খেতাব/দল সহ — একই নামের একাধিক শিক্ষক আলাদা করতে অপশন লেবেলে পদবি যোগ হয় (r4 M14)।
    db.person.findMany({
      orderBy: [{ teamId: "asc" }, { sortOrder: "asc" }],
      select: { id: true, nameBn: true, titleBn: true, team: { select: { nameBn: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/blog" className="hover:text-primary">ব্লগ ও আর্টিকেল</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">নতুন পোস্ট</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <PenLine aria-hidden className="h-6 w-6 text-primary" />
        নতুন পোস্ট লিখুন
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        পড়ার সময় ও স্লাগ স্বয়ংক্রিয়ভাবে তৈরি হয় — ক্যাটাগরি এখানেই নতুন করে যোগ করা যায়।
      </p>
      <PostForm
        mode="create"
        categories={categories}
        authors={authors.map((person) => ({
          id: person.id,
          nameBn: person.nameBn,
          titleBn: person.titleBn,
          teamNameBn: person.team?.nameBn ?? null,
        }))}
        initial={{
          titleBn: "",
          titleEn: "",
          excerptBn: "",
          excerptEn: "",
          bodyBn: "",
          bodyEn: "",
          kind: "ARTICLE",
          categoryId: "",
          authorId: "",
          isPublished: false,
          publishedAt: "",
          cover: null,
        }}
      />
    </div>
  );
}
