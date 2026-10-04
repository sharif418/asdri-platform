import Link from "next/link";
import { redirect } from "next/navigation";
import { Construction } from "lucide-react";
import { getSession, isStaff } from "@/lib/auth";

export const metadata = { title: "ড্যাশবোর্ড" };

/**
 * Foundation dashboard — a verified, role-aware shell while the full CMS
 * modules land in the feat/admin-cms branch.
 */
export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || !isStaff(session.user.role)) redirect("/login");
  const roleLabels: Record<string, string> = {
    ADMIN: "অ্যাডমিনিস্ট্রেটর",
    EDITOR: "সম্পাদক",
    ADMISSIONS: "ভর্তি কর্মকর্তা",
    FINANCE: "অর্থ বিভাগ",
    FATWA: "ফতোয়া বোর্ড",
    APPLICANT: "আবেদনকারী",
  };

  return (
    <div className="container-site py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
          <Construction aria-hidden className="h-6 w-6" />
        </span>
        <h1 className="font-heading mt-4 text-2xl font-bold">স্বাগতম, {session.user.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ভূমিকা: {roleLabels[session.user.role] ?? session.user.role}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          প্ল্যাটফর্মের ভিত্তি এখন পোস্টগ্রেসকিউএল, অবজেক্ট স্টোরেজ ও সেশন-ভিত্তিক প্রমাণীকরণের উপর দাঁড়িয়ে
          আছে। সম্পূর্ণ কনটেন্ট মডিউল আসন্ন শাখাগুলোতে যুক্ত হচ্ছে — নোটিশ, কোর্স, ব্লগ, গ্যালারি, ভর্তি ও
          আর্থিক ব্যবস্থাপনা।
        </p>
        <Link
          href="/"
          className="link-sweep mt-6 inline-block text-sm font-semibold text-primary"
        >
          ওয়েবসাইটে ফিরে যান →
        </Link>
      </div>
    </div>
  );
}
