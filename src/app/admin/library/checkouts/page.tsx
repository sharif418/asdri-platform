import { redirect } from "next/navigation";
import { BookOpenCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { LibraryCheckoutsManager } from "@/components/admin/library/library-checkouts-manager";

export const metadata = { title: "ধার ও পাঠ" };

/** Circulation desk — physical checkouts and their returns. */
export default async function AdminLibraryCheckoutsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "library.manage")) redirect("/admin");

  const items = await db.libraryItem.findMany({
    orderBy: { titleBn: "asc" },
    select: { id: true, titleBn: true, type: true },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
          <BookOpenCheck aria-hidden className="h-6 w-6 text-primary" />
          ধার ও পাঠ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          তাক থেকে বের হওয়া বইয়ের হিসাব — ধার রেকর্ড করুন, মেয়াদ দেখুন, ফেরত নিন।
        </p>
      </div>

      <div className="mt-6">
        <LibraryCheckoutsManager items={items} />
      </div>
    </div>
  );
}
