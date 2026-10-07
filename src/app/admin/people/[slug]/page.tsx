import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { PersonForm } from "@/components/admin/person-form";

export const metadata = { title: "প্রোফাইল সম্পাদনা" };

export default async function EditPersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "academics.manage")) redirect("/admin");

  const { slug } = await params;
  const [person, teams] = await Promise.all([
    db.person.findUnique({
      where: { slug },
      include: { photoMedia: { select: { id: true, filename: true, key: true, width: true, height: true } } },
    }),
    db.team.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } }),
  ]);
  if (!person) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/people" className="hover:text-primary">শিক্ষক ও কর্মকর্তা</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">সম্পাদনা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Users aria-hidden className="h-6 w-6 text-primary" />
        {person.nameBn}
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        পরিবর্তনগুলো অডিট লগে সংরক্ষিত হয় — কে কখন কী বদলেছেন পরে দেখা যাবে।
      </p>
      <PersonForm
        mode="edit"
        teams={teams}
        initial={{
          id: person.id,
          slug: person.slug,
          nameBn: person.nameBn,
          nameEn: person.nameEn,
          titleBn: person.titleBn,
          titleEn: person.titleEn,
          roleTitleBn: person.roleTitleBn,
          roleTitleEn: person.roleTitleEn,
          subjectsBn: person.subjectsBn,
          subjectsEn: person.subjectsEn,
          bioBn: person.bioBn,
          bioEn: person.bioEn,
          teamId: person.teamId ?? "",
          isPublished: person.isPublished,
          isFeatured: person.isFeatured,
          sortOrder: person.sortOrder,
          photo: person.photoMedia
            ? {
                id: person.photoMedia.id,
                filename: person.photoMedia.filename,
                key: person.photoMedia.key,
                width: person.photoMedia.width,
                height: person.photoMedia.height,
              }
            : null,
        }}
      />
    </div>
  );
}
