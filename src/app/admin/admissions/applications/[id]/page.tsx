import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { ApplicationOfficerPanel } from "@/components/admin/application-officer-panel";
import { ExamLetterDialog } from "@/components/admin/exam-letter-dialog";
import {
  APP_DOC_TYPE_LABELS,
  GENDER_LABELS,
  applicationStatusChip,
  applicationStatusLabel,
} from "@/lib/admission-labels";
import { formatDate, formatBytes, toBnDigits } from "@/lib/format";

export const metadata = { title: "আবেদনের বিবরণ" };

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2 last:border-b-0">
      <dt className="shrink-0 text-[12px] text-muted-foreground">{label}</dt>
      <dd className={`min-w-0 break-words text-right text-[13px] font-medium ${mono ? "font-mono text-[11.5px]" : ""}`} dir="auto">
        {value || "—"}
      </dd>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: typeof UserRound; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden className="h-4 w-4 text-primary" />
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Application detail — the officer's single-desk review + decision workflow. */
export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "admissions.manage")) redirect("/admin");

  const { id } = await params;
  const application = await db.application.findUnique({
    where: { id },
    include: {
      intake: {
        include: {
          course: { select: { code: true, titleBn: true } },
          _count: { select: { applications: { where: { status: "ADMITTED" } } } },
        },
      },
      user: { select: { name: true, email: true, phone: true } },
      photoMedia: { select: { key: true, filename: true, mime: true, size: true } },
      education: { orderBy: { sortOrder: "asc" } },
      documents: {
        orderBy: { createdAt: "asc" },
        include: { media: { select: { key: true, filename: true, mime: true, size: true } } },
      },
      events: { orderBy: { createdAt: "asc" }, include: { actor: { select: { name: true } } } },
    },
  });
  if (!application) notFound();

  const intakeAdmitted = application.intake._count.applications;
  const photoUrl = application.photoMedia ? `/api/media/${application.photoMedia.key}` : null;
  const isPhotoImage = (application.photoMedia?.mime ?? "").startsWith("image/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/admissions" className="hover:text-primary">
          ভর্তি ব্যবস্থাপনা
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <Link href="/admin/admissions/applications" className="hover:text-primary">
          আবেদনসমূহ
        </Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground" dir="ltr">
          {application.trackingNo}
        </span>
      </nav>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{application.fullNameBn}</h1>
          <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
            {application.trackingNo} · {application.intake.course.code} {toBnDigits(application.intake.year)} ·{" "}
            {application.intake.sessionBn || application.intake.course.titleBn}
          </p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            জমা: {formatDate(application.submittedAt, "bn")} · আসন:{" "}
            {application.intake.seatsTotal === null
              ? "নির্ধারিত নয়"
              : `ভর্তি ${toBnDigits(intakeAdmitted)}/${toBnDigits(application.intake.seatsTotal)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={applicationStatusChip(application.status)}>{applicationStatusLabel(application.status)}</span>
          <Link
            href="/admin/admissions/applications"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border bg-card px-3 text-[13px] font-semibold hover:bg-secondary"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
            তালিকায় ফিরুন
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-6">
          <SectionCard icon={UserRound} title="আবেদনকারীর প্রোফাইল">
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
              {photoUrl ? (
                <a
                  href={photoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-xl border"
                  aria-label={`আবেদনকারীর ছবি দেখুন (${application.photoMedia?.filename ?? ""})`}
                >
                  {isPhotoImage ? (
                    <img
                      src={photoUrl}
                      alt={`${application.fullNameBn} এর পাসপোর্ট ছবি`}
                      className="h-28 w-24 object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-28 w-24 items-center justify-center bg-secondary/50">
                      <ImageIcon aria-hidden className="h-6 w-6 text-muted-foreground" />
                    </span>
                  )}
                </a>
              ) : (
                <span className="flex h-28 w-24 items-center justify-center rounded-xl border bg-secondary/40">
                  <ImageIcon aria-hidden className="h-6 w-6 text-muted-foreground" />
                </span>
              )}
              <dl className="grid gap-x-6 sm:grid-cols-2">
                <MetaRow label="নাম (বাংলা)" value={application.fullNameBn} />
                <MetaRow label="Name (English)" value={application.fullNameEn} mono />
                <MetaRow label="পিতার নাম" value={application.fatherName} />
                <MetaRow label="মাতার নাম" value={application.motherName} />
                <MetaRow label="জন্ম তারিখ" value={application.birthDate ? formatDate(application.birthDate, "bn") : ""} />
                <MetaRow label="লিঙ্গ" value={GENDER_LABELS[application.gender] ?? application.gender} />
                <MetaRow label="এনআইডি" value={application.nid ?? ""} mono />
                <MetaRow label="মোবাইল" value={application.phone} mono />
                <MetaRow label="ইমেইল" value={application.email ?? ""} mono />
                <MetaRow label="অ্যাকাউন্ট" value={application.user ? `${application.user.name} (${application.user.email})` : "নেই"} />
                <MetaRow label="বর্তমান ঠিকানা" value={application.presentAddress} />
                <MetaRow label="স্থায়ী ঠিকানা" value={application.permanentAddress} />
              </dl>
            </div>
          </SectionCard>

          <SectionCard icon={Users} title="অভিভাবকের তথ্য">
            <dl className="grid gap-x-6 sm:grid-cols-3">
              <MetaRow label="অভিভাবকের নাম" value={application.guardianName} />
              <MetaRow label="মোবাইল" value={application.guardianPhone} mono />
              <MetaRow label="সম্পর্ক" value={application.guardianRelation} />
            </dl>
          </SectionCard>

          <SectionCard icon={GraduationCap} title="শিক্ষাগত যোগ্যতা">
            {application.education.length === 0 ? (
              <p className="text-sm text-muted-foreground">কোনো শিক্ষাগত তথ্য জমা দেওয়া হয়নি।</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">স্তর</th>
                    <th className="hidden py-2 pr-3 font-semibold sm:table-cell">প্রতিষ্ঠান</th>
                    <th className="hidden py-2 pr-3 font-semibold md:table-cell">গ্রুপ/বিষয়</th>
                    <th className="py-2 pr-3 font-semibold">সাল</th>
                    <th className="py-2 font-semibold">ফলাফল</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {application.education.map((row) => (
                    <tr key={row.id}>
                      <td className="py-2.5 pr-3 font-medium">{row.level}</td>
                      <td className="hidden py-2.5 pr-3 text-muted-foreground sm:table-cell">{row.institution || "—"}</td>
                      <td className="hidden py-2.5 pr-3 text-muted-foreground md:table-cell">{row.groupOrSubject || "—"}</td>
                      <td className="py-2.5 pr-3">{row.year ? toBnDigits(row.year) : "—"}</td>
                      <td className="py-2.5">{row.result || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard icon={FileText} title="সংযুক্ত ডকুমেন্ট">
            {application.documents.length === 0 && !photoUrl ? (
              <p className="text-sm text-muted-foreground">কোনো ডকুমেন্ট আপলোড করা হয়নি।</p>
            ) : (
              <ul className="space-y-2">
                {photoUrl && application.photoMedia && (
                  <li className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <ImageIcon aria-hidden className="h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">পাসপোর্ট ছবি</span>
                        <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
                          {application.photoMedia.filename} · {formatBytes(application.photoMedia.size, "bn")}
                        </span>
                      </span>
                    </div>
                    <a
                      href={photoUrl}
                      download={application.photoMedia.filename}
                      className="text-[12.5px] font-semibold text-primary hover:underline"
                    >
                      ডাউনলোড
                    </a>
                  </li>
                )}
                {application.documents.map((doc) => (
                  <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-medium">{APP_DOC_TYPE_LABELS[doc.type]}</span>
                        <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
                          {doc.media.filename} · {formatBytes(doc.media.size, "bn")}
                        </span>
                      </span>
                    </div>
                    <span className="flex gap-3">
                      <a href={`/api/media/${doc.media.key}`} target="_blank" rel="noreferrer" className="text-[12.5px] font-semibold text-primary hover:underline">
                        দেখুন
                      </a>
                      <a href={`/api/media/${doc.media.key}`} download={doc.media.filename} className="text-[12.5px] font-semibold text-primary hover:underline">
                        ডাউনলোড
                      </a>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard icon={BadgeCheck} title="ঘোষণাপত্র ও মূল্যায়ন">
            <dl className="grid gap-x-6 sm:grid-cols-2">
              <MetaRow
                label="ঘোষণায় সম্মতি"
                value={application.declarationAccepted ? "সম্মত (স্বাক্ষরিত)" : "সম্মতি নেই"}
              />
              <MetaRow label="লিখিত স্কোর" value={application.examScore === null ? "" : toBnDigits(application.examScore)} />
              <MetaRow label="মৌখিক স্কোর" value={application.vivaScore === null ? "" : toBnDigits(application.vivaScore)} />
              <MetaRow label="আভ্যন্তরীণ রিভিউ নোট" value={application.reviewNote} />
            </dl>
          </SectionCard>

          <SectionCard icon={CalendarDays} title="প্রক্রিয়ার ধাপ (টাইমলাইন)">
            {application.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">এখনো কোনো ইভেন্ট নেই।</p>
            ) : (
              <ol className="mt-1 space-y-4 border-l-2 border-gold/40 pl-5">
                {application.events.map((event) => (
                  <li key={event.id} className="relative">
                    <span aria-hidden className="absolute -left-[26px] top-1.5 h-3 w-3 rotate-45 bg-gold" />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={applicationStatusChip(event.status)}>{applicationStatusLabel(event.status)}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(event.createdAt, "bn")} · {event.actor?.name ?? "সিস্টেম"}
                      </span>
                    </div>
                    {event.note && <p className="mt-1 text-[12.5px] text-foreground/90" dir="auto">{event.note}</p>}
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6 xl:sticky xl:top-20 xl:h-fit">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList aria-hidden className="h-4 w-4 text-primary" />
              ইনটেক
            </h2>
            <dl className="mt-2">
              <MetaRow label="কোর্স" value={`${application.intake.course.code} — ${application.intake.course.titleBn}`} />
              <MetaRow label="ব্যাচ" value={application.intake.sessionBn || toBnDigits(application.intake.year)} />
              <MetaRow label="আবেদন শুরু" value={application.intake.opensAt ? formatDate(application.intake.opensAt, "bn") : ""} />
              <MetaRow label="আবেদন শেষ" value={application.intake.closesAt ? formatDate(application.intake.closesAt, "bn") : ""} />
              <MetaRow label="পরীক্ষার তারিখ" value={application.intake.examDate ? formatDate(application.intake.examDate, "bn") : ""} />
            </dl>
            {application.intake.examDate && (
              <p className="mt-3 rounded-lg bg-gold/10 px-3.5 py-2 text-[12.5px] font-medium text-gold-foreground dark:text-gold">
                <ShieldCheck aria-hidden className="mr-1 inline h-3.5 w-3.5" />
                পরীক্ষার তারিখ শর্টলিস্টকৃত আবেদনকারীরা অ্যাকাউন্টে দেখবেন।
              </p>
            )}
          </section>

          {/* Exam-call letter (admit card) — the officer fills date/time/venue,
              the A4 pad opens in a new tab and prints with the brand. */}
          <ExamLetterDialog
            applicationId={application.id}
            intakeId={application.intake.id}
            defaultDate={application.intake.examDate ? formatDate(application.intake.examDate, "bn") : ""}
            defaultTime={application.intake.examTimeBn}
            defaultVenue={application.intake.examVenueBn}
          />
          <ApplicationOfficerPanel applicationId={application.id} currentStatus={application.status} />
        </div>
      </div>
    </div>
  );
}
