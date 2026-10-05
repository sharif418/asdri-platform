import { redirect } from "next/navigation";
import { PanelTop } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { MenusManager } from "@/components/admin/menus-manager";
import { formatNumber } from "@/lib/format";

export const metadata = { title: "নেভিগেশন মেনু" };

/** Navigation menu editor — the tree the public header/footer actually render. */
export default async function AdminMenusPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "menus")) redirect("/admin");

  const items = await db.menuItem.findMany({
    orderBy: [{ location: "asc" }, { sortOrder: "asc" }],
  });
  const flags = await db.featureFlag.findMany({ select: { key: true, labelBn: true, isEnabled: true } });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <a href="/admin/settings" className="hover:text-primary hover:underline">
          সাইট সেটিংস
        </a>
        <span aria-hidden>›</span>
        <span>নেভিগেশন মেনু</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <PanelTop aria-hidden className="h-6 w-6 text-primary" />
        নেভিগেশন মেনু
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {formatNumber(items.length, "bn")}টি আইটেম — হেডারের মেগা-মেনু, ইউটিলিটি বার ও ফুটারের লিংক এখান থেকেই
        বদলায়। সেভ করলে সাথে সাথে প্রকাশ্য সাইটে দেখায়।
      </p>

      <div className="mt-6">
        <MenusManager items={items} flags={flags} />
      </div>
    </div>
  );
}
