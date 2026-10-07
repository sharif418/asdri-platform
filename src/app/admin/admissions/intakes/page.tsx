import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IntakesTable, type IntakeRowData } from "@/components/admin/intakes-table";
import { IntakeDialog, type IntakeCourseOption } from "@/components/admin/intake-dialog";
import { Button } from "@/components/ui/button";
import { formatNumber, toBnDigits } from "@/lib/format";

export const metadata = { title: "ইনটেক ও ব্যাচ" };

/** Intakes manager — every course-year intake with seats, dates, and open/close. */
export default async function AdminIntakesPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "admissions.manage")) redirect("/admin");

  const [intakeRows, admittedRows, courses] = await Promise.all([
    db.intake.findMany({
      orderBy: [{ year: "desc" }, { createdAt: "asc" }],
      include: {
        course: { select: { id: true, code: true, titleBn: true } },
        _count: { select: { applications: true } },
      },
    }),
    db.application.groupBy({ by: ["intakeId"], where: { status: "ADMITTED" }, _count: { _all: true } }),
    db.course.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, titleBn: true } }),
  ]);

  const admittedMap = new Map(admittedRows.map((row) => [row.intakeId, row._count._all]));
  const intakes: IntakeRowData[] = intakeRows.map((intake) => ({
    id: intake.id,
    courseId: intake.course.id,
    courseCode: intake.course.code,
    courseTitleBn: intake.course.titleBn,
    year: intake.year,
    sessionBn: intake.sessionBn,
    sessionEn: intake.sessionEn,
    seatsTotal: intake.seatsTotal,
    admitted: admittedMap.get(intake.id) ?? 0,
    applicants: intake._count.applications,
    opensAt: intake.opensAt?.toISOString() ?? null,
    closesAt: intake.closesAt?.toISOString() ?? null,
    examDate: intake.examDate?.toISOString() ?? null,
    examTimeBn: intake.examTimeBn,
    examVenueBn: intake.examVenueBn,
    status: intake.status,
    isPublished: intake.isPublished,
  }));

  const openCount = intakeRows.filter((i) => i.status === "OPEN" && i.isPublished).length;
  const courseOptions: IntakeCourseOption[] = courses.map((c) => ({ id: c.id, code: c.code, titleBn: c.titleBn }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/admissions" className="hover:text-primary">
          ভর্তি ব্যবস্থাপনা
        </Link>
        <span aria-hidden className="mx-1.5">
          /
        </span>
        <span className="text-foreground">ইনটেক ও ব্যাচ</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
            <CalendarRange aria-hidden className="h-6 w-6 text-primary" />
            ইনটেক ও ব্যাচ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            কোর্সভিত্তিক ভর্তি ব্যাচ — {toBnDigits(intakes.length)} টি ইনটেক, এর মধ্যে খোলা {formatNumber(openCount, "bn")} টি।
            খোলা ও প্রকাশিত ইনটেকই আবেদন ফর্মে দেখা যায়।
          </p>
        </div>
        <IntakeDialog
          mode="create"
          courses={courseOptions}
          initial={{
            courseId: courseOptions[0]?.id ?? "",
            year: String(new Date().getFullYear()),
            sessionBn: "",
            sessionEn: "",
            seatsTotal: "",
            opensAt: "",
            closesAt: "",
            examDate: "",
            examTimeBn: "",
            examVenueBn: "",
            status: "UPCOMING",
            isPublished: true,
          }}
          trigger={
            <Button className="gap-2 font-semibold">
              <CalendarRange aria-hidden className="h-4 w-4" />
              নতুন ইনটেক
            </Button>
          }
        />
      </div>

      <div className="mt-6">
        <IntakesTable intakes={intakes} courses={courseOptions} />
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground">
        আবেদন যাচাই ও নির্বাচনের জন্য{" "}
        <Link href="/admin/admissions/applications" className="font-semibold text-primary hover:underline">
          আবেদনসমূহ
        </Link>{" "}
        পাতায় যান।
      </p>
    </div>
  );
}
