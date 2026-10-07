import { redirect } from "next/navigation";
import { Flag } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { FlagsManager } from "@/components/admin/flags-manager";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "ফিচার ফ্ল্যাগ" };

/** Feature flag toggles — modules on/off across nav, sitemap, search and public APIs. */
export default async function AdminFlagsPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "flags.manage")) redirect("/admin");

  const flags = await db.featureFlag.findMany({ orderBy: { key: "asc" } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <a href="/admin/settings" className="hover:text-primary hover:underline">
          সাইট সেটিংস
        </a>
        <span aria-hidden>›</span>
        <span>ফিচার ফ্ল্যাগ</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <Flag aria-hidden className="h-6 w-6 text-primary" />
        ফিচার ফ্ল্যাগ
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {formatNumber(flags.length, "bn")}টি মডিউল — বন্ধ করলে নেভিগেশন, সাইটম্যাপ, সার্চ ও পাবলিক API থেকেই সরে যায়।
      </p>

      <div className="mt-6">
        <FlagsManager flags={flags} />
      </div>
    </div>
  );
}
