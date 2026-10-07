import { redirect } from "next/navigation";
import { BookOpen, BookOpenCheck, Eye, FileText, LibraryBig, Newspaper } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LibraryManager } from "@/components/admin/library/library-manager";

export const metadata = { title: "লাইব্রেরি ক্যাটালগ" };

function StatChip({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm">
      <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-lg font-bold leading-none">{value}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/** Library catalogue manager — the librarian's main desk. */
export default async function AdminLibraryPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "library.manage")) redirect("/admin");

  const [totalItems, books, journalIssues, readings, openCheckouts, categories] = await Promise.all([
    db.libraryItem.count(),
    db.libraryItem.count({ where: { type: "BOOK" } }),
    db.libraryItem.count({ where: { type: "JOURNAL_ISSUE" } }),
    db.libraryReading.count(),
    db.libraryCheckout.count({ where: { returnedAt: null } }),
    db.libraryCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, nameBn: true, nameEn: true, parentId: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <LibraryBig aria-hidden className="h-6 w-6 text-primary" />
            লাইব্রেরি
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            অনলাইন ক্যাটালগ — বই, জার্নাল সংখ্যা, পেপার ও ডিজিটাল ফাইলের তালিকা, ফাইল সংযুক্তি ও ধার ব্যবস্থাপনা।
          </p>
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          <span className={cn("rounded-full bg-secondary px-2 py-0.5 font-semibold")}>গ্রন্থাগারিক মডিউল</span>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatChip icon={LibraryBig} value={toBnDigits(totalItems)} label="মোট আইটেম" />
        <StatChip icon={BookOpen} value={toBnDigits(books)} label="বই" />
        <StatChip icon={Newspaper} value={toBnDigits(journalIssues)} label="জার্নাল সংখ্যা" />
        <StatChip icon={Eye} value={toBnDigits(readings)} label="পড়া হয়েছে" />
        <StatChip icon={BookOpenCheck} value={toBnDigits(openCheckouts)} label="বর্তমানে ধার" />
      </div>

      <div className="mt-6">
        <LibraryManager categories={categories} />
      </div>
    </div>
  );
}
