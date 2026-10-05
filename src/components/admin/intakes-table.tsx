"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarX, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { IntakeStatus } from "@prisma/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { IntakeDialog, intakeFormInitial, type IntakeCourseOption } from "@/components/admin/intake-dialog";
import { intakeStatusChip, intakeStatusLabel } from "@/lib/admission-labels";
import { formatDate, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import { adminConfirm } from "@/components/admin/ui/confirm";

export interface IntakeRowData {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitleBn: string;
  year: number;
  sessionBn: string;
  sessionEn: string;
  seatsTotal: number | null;
  admitted: number;
  applicants: number;
  opensAt: string | null;
  closesAt: string | null;
  examDate: string | null;
  status: IntakeStatus;
  isPublished: boolean;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Seat-fill bar: ভর্তি নিশ্চিত সংখ্যা vs মোট আসন. */
function SeatBar({ admitted, seatsTotal, applicants }: { admitted: number; seatsTotal: number | null; applicants: number }) {
  if (seatsTotal === null) {
    return (
      <div>
        <p className="text-[12.5px] font-semibold">আসন: নির্ধারিত নয়</p>
        <p className="text-[11px] text-muted-foreground">আবেদন {toBnDigits(applicants)}</p>
      </div>
    );
  }
  const pct = seatsTotal > 0 ? Math.min(100, Math.round((admitted / seatsTotal) * 100)) : 0;
  const full = admitted >= seatsTotal;
  return (
    <div className="min-w-32">
      <p className="text-[12.5px] font-semibold">
        <span className={cn(full && "text-primary")}>
          {toBnDigits(admitted)}/{toBnDigits(seatsTotal)}
        </span>{" "}
        <span className="text-[11px] font-normal text-muted-foreground">ভর্তি · আবেদন {toBnDigits(applicants)}</span>
      </p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={admitted} aria-valuemin={0} aria-valuemax={seatsTotal} aria-label="আসন পূর্ণতা">
        <div className={cn("h-full rounded-full", full ? "bg-primary" : "bg-gold")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Intakes manager table — create/edit dialog, open/close, delete. */
export function IntakesTable({ intakes, courses }: { intakes: IntakeRowData[]; courses: IntakeCourseOption[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function patchStatus(intake: IntakeRowData, status: IntakeStatus) {
    if (busyId) return;
    setBusyId(intake.id);
    try {
      const res = await fetch(`/api/admin/intakes/${intake.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "স্ট্যাটাস বদলানো যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: status === "OPEN" ? "ইনটেক খোলা হয়েছে — আবেদন ফর্মে দেখা যাবে" : "ইনটেক বন্ধ করা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(intake: IntakeRowData) {
    if (busyId) return;
    if (!(await adminConfirm({ title: `${intake.courseCode} ${intake.year} ইনটেকটি মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setBusyId(intake.id);
    try {
      const res = await fetch(`/api/admin/intakes/${intake.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ইনটেক মুছে ফেলা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (intakes.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-bold">এখনো কোনো ইনটেক নেই</p>
        <p className="mt-1 text-sm text-muted-foreground">
          প্রথম ইনটেক তৈরি করুন — কোর্স, আসন ও সময়সীমা ঠিক করে খুলে দিলে আবেদন ফর্মে দেখা যাবে।
        </p>
        <div className="mt-4 flex justify-center">
          <IntakeDialog
            mode="create"
            courses={courses}
            initial={{
              courseId: courses[0]?.id ?? "",
              year: String(new Date().getFullYear()),
              sessionBn: "",
              sessionEn: "",
              seatsTotal: "",
              opensAt: "",
              closesAt: "",
              examDate: "",
              status: "UPCOMING",
              isPublished: true,
            }}
            trigger={
              <Button className="gap-2 font-semibold">
                <Plus aria-hidden className="h-4 w-4" />
                নতুন ইনটেক
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-clip rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">কোর্স ও ব্যাচ</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">আসন</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">সময়সীমা</th>
            <th className="hidden px-4 py-3 font-semibold lg:table-cell">পরীক্ষার তারিখ</th>
            <th className="px-4 py-3 font-semibold">স্ট্যাটাস</th>
            <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {intakes.map((intake) => (
            <tr key={intake.id} className="transition-colors hover:bg-secondary/20">
              <td className="max-w-xs px-4 py-3">
                <span className="font-mono text-[10.5px] font-bold text-muted-foreground" dir="ltr">
                  {intake.courseCode}
                </span>
                <p className="truncate text-[13.5px] font-medium">{intake.courseTitleBn}</p>
                <p className="text-[11px] text-muted-foreground">
                  {intake.sessionBn || `${intake.year}`} · বছর {toBnDigits(intake.year)}
                  {!intake.isPublished && <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">ড্রাফট</span>}
                </p>
              </td>
              <td className="hidden px-4 py-3 md:table-cell">
                <SeatBar admitted={intake.admitted} seatsTotal={intake.seatsTotal} applicants={intake.applicants} />
              </td>
              <td className="hidden px-4 py-3 text-[12.5px] lg:table-cell">
                {intake.opensAt || intake.closesAt ? (
                  <p className="text-muted-foreground">
                    {intake.opensAt ? formatDate(intake.opensAt, "bn") : "—"} <span aria-hidden>থেকে</span>
                    <br />
                    {intake.closesAt ? formatDate(intake.closesAt, "bn") : "খোলা"}
                  </p>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="hidden px-4 py-3 text-[12.5px] lg:table-cell">
                {intake.examDate ? (
                  <span className="rounded-full bg-gold/10 px-2 py-0.5 font-semibold text-gold-foreground dark:text-gold">
                    {formatDate(intake.examDate, "bn")}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className={intakeStatusChip(intake.status)}>{intakeStatusLabel(intake.status)}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1.5">
                  {busyId === intake.id ? (
                    <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      {intake.status !== "OPEN" ? (
                        <button
                          type="button"
                          onClick={() => patchStatus(intake, "OPEN")}
                          title="আবেদন গ্রহণ চালু করুন"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 text-[12px] font-semibold text-primary transition-colors hover:bg-primary/20"
                        >
                          <CalendarCheck aria-hidden className="h-3.5 w-3.5" />
                          খুলুন
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => patchStatus(intake, "CLOSED")}
                          title="আবেদন গ্রহণ বন্ধ করুন"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:bg-secondary"
                        >
                          <CalendarX aria-hidden className="h-3.5 w-3.5" />
                          বন্ধ
                        </button>
                      )}
                      <IntakeDialog
                        mode="edit"
                        courses={courses}
                        initial={intakeFormInitial({
                          id: intake.id,
                          courseId: intake.courseId,
                          year: intake.year,
                          sessionBn: intake.sessionBn,
                          sessionEn: intake.sessionEn,
                          seatsTotal: intake.seatsTotal,
                          opensAt: intake.opensAt,
                          closesAt: intake.closesAt,
                          examDate: intake.examDate,
                          status: intake.status,
                          isPublished: intake.isPublished,
                        })}
                        trigger={
                          <button
                            type="button"
                            aria-label={`${intake.courseCode} ${intake.year} সম্পাদনা`}
                            title="সম্পাদনা"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <Pencil aria-hidden className="h-4 w-4" />
                          </button>
                        }
                      />
                      <button
                        type="button"
                        onClick={() => onDelete(intake)}
                        aria-label={`${intake.courseCode} ${intake.year} মুছে ফেলুন`}
                        title="মুছে ফেলুন"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 aria-hidden className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
