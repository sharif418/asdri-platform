import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { brand } from "@/lib/brand";
import { BrandMonoMark } from "@/components/shared/logo";
import { PrintOnLoad } from "@/components/admin/print-on-load";
import { toBnDigits } from "@/lib/format";

export const metadata: Metadata = { title: "লিখিত পরীক্ষার প্রবেশপত্র" };

interface ExamLetterPageProps {
  params: Promise<{ id: string }>;
  /** Exam date/time/venue come from the officer's print dialog; anything
   *  absent prints as a hand-fillable Bangla placeholder. */
  searchParams: Promise<{ date?: string; time?: string; venue?: string }>;
}

/** One labelled row of the applicant block. */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-dashed border-foreground/20 py-2.5">
      <dt className="w-40 shrink-0 text-[13px] font-semibold text-foreground/70">{label}</dt>
      <dd className="min-w-0 break-words text-[15px] font-semibold" dir="auto">
        {value}
      </dd>
    </div>
  );
}

/**
 * লিখিত পরীক্ষার প্রবেশপত্র (admit card) — the one document from the
 * admissions flow that physically leaves the building with the applicant,
 * so it carries the institute's mark. An A4 print pad opened from the
 * application desk; it isolates itself for printing (body.printing-exam-letter)
 * and auto-opens the print dialog (PrintOnLoad) when opened in a new tab.
 */
export default async function ExamLetterPage({ params, searchParams }: ExamLetterPageProps) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "admissions.manage")) redirect("/admin");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const application = await db.application.findUnique({
    where: { id },
    select: {
      fullNameBn: true,
      trackingNo: true,
      guardianName: true,
      // Applicant photos are PRIVATE media — this page is staff-gated and
      // the /api/media stream authorises staff, so the session renders it.
      photoMedia: { select: { key: true, mime: true } },
      intake: {
        select: {
          sessionBn: true,
          year: true,
          course: { select: { code: true, titleBn: true } },
        },
      },
    },
  });
  if (!application) notFound();

  const examDate = query.date?.trim() || "____";
  const examTime = query.time?.trim() || "____";
  const examVenue = query.venue?.trim() || "____";
  const hasPhoto = Boolean(application.photoMedia && application.photoMedia.mime.startsWith("image/"));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 print:p-0">
      <PrintOnLoad bodyClass="printing-exam-letter" />

      {/* ————— the A4 pad ————— */}
      <div className="print-zone bg-card p-7 shadow-sm sm:p-10 print:p-0 print:shadow-none">
        {/* branded masthead — mark + institute name (the pad's own head) */}
        <div className="flex items-center gap-4 border-b-2 border-foreground/80 pb-4">
          <BrandMonoMark tone="emerald" className="h-14 w-auto" />
          <div className="min-w-0">
            <p className="font-heading text-lg font-bold leading-snug">{brand.nameBn}</p>
            <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/60" lang="en">
              {brand.nameEn}
            </p>
          </div>
        </div>

        {/* title */}
        <div className="mt-6 text-center">
          <h1 className="font-heading text-2xl font-bold">লিখিত পরীক্ষার প্রবেশপত্র</h1>
          <span aria-hidden className="mx-auto mt-3 block h-0.5 w-28 bg-gold" />
        </div>

        {/* applicant block + photo box */}
        <div className="mt-7 flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
          <dl className="min-w-0 flex-1">
            <InfoRow label="আবেদনকারীর নাম" value={application.fullNameBn} />
            <InfoRow label="রোল নম্বর" value={application.trackingNo} />
            <InfoRow
              label="কোর্স"
              value={`${application.intake.course.code} — ${application.intake.course.titleBn}`}
            />
            <InfoRow
              label="শিক্ষাবর্ষ / ব্যাচ"
              value={application.intake.sessionBn || toBnDigits(application.intake.year)}
            />
            <InfoRow label="অভিভাবকের নাম" value={application.guardianName || "—"} />
          </dl>
          {hasPhoto && application.photoMedia ? (
            // Plain <img> (as on the detail page): the photo streams through
            // the session-gated media API, which next/image would re-fetch
            // through its own unauthenticated optimiser.
            <img
              src={`/api/media/${application.photoMedia.key}`}
              alt={`${application.fullNameBn} এর পাসপোর্ট ছবি`}
              className="h-32 w-28 shrink-0 border border-foreground/40 object-cover"
            />
          ) : (
            <span className="flex h-32 w-28 shrink-0 items-center justify-center border border-dashed border-foreground/50 text-center text-[11px] font-medium leading-relaxed text-foreground/60">
              পাসপোর্ট সাইজ ছবি
            </span>
          )}
        </div>

        {/* exam schedule */}
        <div className="mt-7 grid grid-cols-1 gap-4 rounded-lg border border-foreground/25 bg-muted/30 p-4 sm:grid-cols-3 print:bg-transparent">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">তারিখ</p>
            <p className="mt-1 text-[15px] font-bold" dir="auto">
              {examDate}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">সময়</p>
            <p className="mt-1 text-[15px] font-bold" dir="auto">
              {examTime}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/60">স্থান</p>
            <p className="mt-1 text-[15px] font-bold" dir="auto">
              {examVenue}
            </p>
          </div>
        </div>

        {/* instructions */}
        <div className="mt-7 rounded-lg border border-foreground/25 p-4 sm:p-5">
          <h2 className="font-heading text-[15px] font-bold">নির্দেশনা</h2>
          <ol className="mt-2.5 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed">
            <li>পরীক্ষায় অংশগ্রহণের জন্য এই প্রবেশপত্র ও জাতীয় পরিচয়পত্র (এনআইডি) সাথে আনা বাধ্যতামূলক।</li>
            <li>পরীক্ষা শুরুর অন্তত ৩০ মিনিট আগে নির্ধারিত কেন্দ্রে উপস্থিত থাকুন।</li>
            <li>পরীক্ষার সময় মোবাইল ফোন ও অন্য কোনো ইলেকট্রনিক ডিভাইস সম্পূর্ণ বন্ধ রাখুন।</li>
            <li>প্রবেশপত্র ছাড়া পরীক্ষার কক্ষে প্রবেশের অনুমতি দেওয়া হবে না।</li>
          </ol>
        </div>

        {/* officer signature */}
        <div className="mt-12 flex justify-end">
          <div className="w-60 text-center">
            <span aria-hidden className="block border-t border-foreground/70" />
            <p className="mt-2 text-[13px] font-semibold">ভর্তি কর্মকর্তার স্বাক্ষর ও সিল</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground print:hidden">
        এই পাতাটি একটি A4 প্রবেশপত্র — নতুন ট্যাবে খুললে প্রিন্ট ডায়ালগ স্বয়ংক্রিয়ভাবে খুলবে।
      </p>
    </div>
  );
}
