import { redirect } from "next/navigation";
import { FolderTree } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { LibraryCategoriesManager } from "@/components/admin/library/library-categories-manager";

export const metadata = { title: "লাইব্রেরি ক্যাটাগরি" };

/** Category tree for the catalogue — two levels, drag-free reorder buttons. */
export default async function AdminLibraryCategoriesPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "library.manage")) redirect("/admin");

  const categories = await db.libraryCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { items: true, children: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
          <FolderTree aria-hidden className="h-6 w-6 text-primary" />
          লাইব্রেরি ক্যাটাগরি
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">ক্যাটালগের শাখা-প্রশাখা — দুই স্তর পর্যন্ত গভীর, উপরে-নিচে সরানো যায়।</p>
      </div>

      <div className="mt-6">
        <LibraryCategoriesManager categories={categories} />
      </div>
    </div>
  );
}
