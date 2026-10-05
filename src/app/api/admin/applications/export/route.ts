import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireModule, unauthorized, forbidden } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/applications/export — CSV of the filtered applications. */
export async function GET(request: NextRequest): Promise<Response> {
  const guard = await requireModule(request, "admissions");
  if ("error" in guard) return guard.error === "unauth" ? unauthorized() : forbidden();

  const url = new URL(request.url);
  const intakeId = url.searchParams.get("intakeId") || undefined;
  const status = url.searchParams.get("status") || undefined;

  const rows = await db.application.findMany({
    where: {
      ...(intakeId ? { intakeId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { submittedAt: "desc" },
    include: {
      intake: { include: { course: { select: { code: true } } } },
      education: { orderBy: { sortOrder: "asc" } },
    },
  });

  const header = [
    "ট্র্যাকিং নম্বর",
    "কোর্স",
    "বছর",
    "নাম (বাংলা)",
    "Name (English)",
    "পিতা",
    "মাতা",
    "জন্ম তারিখ",
    "মোবাইল",
    "ইমেইল",
    "শিক্ষা (সর্বোচ্চ)",
    "ফলাফল",
    "অবস্থা",
    "লিখিত",
    "মৌখিক",
    "জমার তারিখ",
  ];
  const csvEscape = (value: string | number | null | undefined): string => {
    const s = String(value ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.map(csvEscape).join(",")];
  for (const row of rows) {
    const highest = row.education[row.education.length - 1];
    lines.push(
      [
        row.trackingNo,
        row.intake.course.code,
        row.intake.year,
        row.fullNameBn,
        row.fullNameEn,
        row.fatherName,
        row.motherName,
        row.birthDate ? row.birthDate.toISOString().slice(0, 10) : "",
        row.phone,
        row.email ?? "",
        highest ? `${highest.level} — ${highest.institution}` : "",
        highest?.result ?? "",
        row.status,
        row.examScore ?? "",
        row.vivaScore ?? "",
        row.submittedAt.toISOString().slice(0, 10),
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  const csv = "\uFEFF" + lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="asdri-applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
