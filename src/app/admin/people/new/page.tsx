import Link from "next/link";
import { Users } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/admin/person-form";

export const metadata = { title: "নতুন প্রোফাইল" };

export default async function NewPersonPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "academics")) redirect("/admin");

  const teams = await db.team.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameBn: true } });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/people" className="hover:text-primary">শিক্ষক ও কর্মকর্তা</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">নতুন প্রোফাইল</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Users aria-hidden className="h-6 w-6 text-primary" />
        নতুন প্রোফাইল তৈরি
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        নাম ও দল দিয়ে শুরু করুন — বাকি তথ্য পরে যোগ করা যাবে। ছবি মিডিয়া লাইব্রেরি থেকে বেছে নেওয়া যায়।
      </p>
      <PersonForm
        mode="create"
        teams={teams}
        initial={{
          nameBn: "",
          nameEn: "",
          titleBn: "",
          titleEn: "",
          roleTitleBn: "",
          roleTitleEn: "",
          subjectsBn: "",
          subjectsEn: "",
          bioBn: "",
          bioEn: "",
          teamId: "",
          isPublished: true,
          isFeatured: false,
          sortOrder: 0,
          photo: null,
        }}
      />
    </div>
  );
}
