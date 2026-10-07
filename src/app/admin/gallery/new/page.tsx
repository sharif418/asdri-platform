import Link from "next/link";
import { Images } from "lucide-react";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlbumForm } from "@/components/admin/album-form";

export const metadata = { title: "নতুন অ্যালবাম" };

export default async function NewAlbumPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "content.manage")) redirect("/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/gallery" className="hover:text-primary">গ্যালারি</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">নতুন অ্যালবাম</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Images aria-hidden className="h-6 w-6 text-primary" />
        নতুন অ্যালবাম তৈরি
      </h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        শিরোনাম দিয়ে অ্যালবাম তৈরি করুন — এরপর সম্পাদনা পাতায় ছবি যোগ করা যাবে।
      </p>
      <AlbumForm
        mode="create"
        initial={{
          titleBn: "",
          titleEn: "",
          descriptionBn: "",
          descriptionEn: "",
          isPublished: true,
          sortOrder: 0,
          cover: null,
        }}
      />
    </div>
  );
}
