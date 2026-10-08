import { redirect } from "next/navigation";
import { GraduationCap, Network, Users, Eye } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { toBnDigits } from "@/lib/format";
import { ALUMNI_COURSE_LABELS } from "@/lib/alumni";
import { AlumniManager } from "@/components/admin/alumni/alumni-manager";

export const metadata = { title: "অ্যালামনাই রেজিস্ট্রি" };

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

/** Alumni registry manager — the admissions office's graduate ledger. */
export default async function AdminAlumniPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "alumni.manage")) redirect("/admin");

  const [total, published, linked, byCourse] = await Promise.all([
    db.alumniProfile.count(),
    db.alumniProfile.count({ where: { isPublished: true } }),
    db.alumniProfile.count({ where: { userId: { not: null } } }),
    db.alumniProfile.groupBy({ by: ["courseKey"], _count: { _all: true } }),
  ]);
  const courseCounts = Object.fromEntries(byCourse.map((g) => [g.courseKey, g._count._all]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <GraduationCap aria-hidden className="h-6 w-6 text-primary" />
            অ্যালামনাই রেজিস্ট্রি
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            সম্পন্ন হওয়া প্রতিটি ব্যাচের শিক্ষার্থীদের অফিস সংরক্ষণ তালিকা — রেজিস্ট্রি নম্বর, বর্তমান পরিচয় ও
            ডিরেক্টরি প্রকাশনা।
          </p>
        </div>
        <p className="text-[11.5px] text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold">ভর্তি ব্যবস্থাপনা</span>
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={Users} value={toBnDigits(total)} label="মোট রেকর্ড" />
        <StatChip icon={Eye} value={toBnDigits(published)} label="ডিরেক্টরিতে প্রকাশিত" />
        <StatChip icon={Network} value={toBnDigits(linked)} label="অ্যাকাউন্টের সঙ্গে যুক্ত" />
        <StatChip icon={GraduationCap} value={toBnDigits(courseCounts["PGDID"] ?? 0)} label={ALUMNI_COURSE_LABELS.PGDID.bn} />
      </div>

      <div className="mt-6">
        <AlumniManager />
      </div>
    </div>
  );
}
