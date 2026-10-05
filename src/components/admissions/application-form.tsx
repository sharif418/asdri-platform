"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Loader2, Plus, Trash2, UploadCloud, UserCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField } from "@/components/admin/ui/bilingual-field";
import { toBnDigits } from "@/lib/format";

export interface IntakeOption {
  id: string;
  labelBn: string;
  labelEn: string;
  courseCode: string;
  seatsTotal: number | null;
  closesAt: string | null;
  examDate: string | null;
}

interface EducationRow {
  level: string;
  institution: string;
  groupOrSubject: string;
  year: string;
  result: string;
}

const APP_DOC_TYPE_OPTIONS = [
  { value: "TRANSCRIPT", labelBn: "মার্কশিট", labelEn: "Transcript" },
  { value: "CERTIFICATE", labelBn: "সনদপত্র", labelEn: "Certificate" },
  { value: "NID", labelBn: "জাতীয় পরিচয়পত্র", labelEn: "National ID" },
  { value: "CHARACTER", labelBn: "চারিত্রিক সনদ", labelEn: "Character certificate" },
  { value: "OTHER", labelBn: "অন্যান্য", labelEn: "Other" },
] as const;

type AppDocTypeValue = (typeof APP_DOC_TYPE_OPTIONS)[number]["value"];

interface UploadedFile {
  mediaId: string;
  filename: string;
  docType: AppDocTypeValue;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

async function uploadDoc(file: File, kind: "IMAGE" | "DOCUMENT"): Promise<UploadedFile> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  // The upload route is CSRF-guarded like every other mutating route (round 3).
  const res = await fetch("/api/admissions/documents", {
    method: "POST",
    body: form,
    headers: { "x-csrf-token": csrfToken() },
  });
  const json = (await res.json()) as { ok: boolean; error?: string; data?: { mediaId: string } };
  if (!res.ok || !json.ok || !json.data) {
    throw new Error(json.error ?? "আপলোড ব্যর্থ");
  }
  return { mediaId: json.data.mediaId, filename: file.name, docType: "TRANSCRIPT" as AppDocTypeValue };
}

const inputClass =
  "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50";

/** The application form — personal, guardian, education rows, documents, declaration. */
export function ApplicationForm({
  intakes,
  loggedIn,
  declarationBn,
  declarationEn,
  lang,
}: {
  intakes: IntakeOption[];
  loggedIn: boolean;
  declarationBn: string;
  declarationEn: string;
  lang: "bn" | "en";
}) {
  const router = useRouter();
  const bn = lang === "bn";

  const [intakeId, setIntakeId] = useState(intakes[0]?.id ?? "");
  const [fullNameBn, setFullNameBn] = useState("");
  const [fullNameEn, setFullNameEn] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [presentAddress, setPresentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");
  const [education, setEducation] = useState<EducationRow[]>([
    { level: "", institution: "", groupOrSubject: "", year: "", result: "" },
  ]);
  const [photo, setPhoto] = useState<UploadedFile | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [documents, setDocuments] = useState<UploadedFile[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedIntake = useMemo(() => intakes.find((i) => i.id === intakeId), [intakeId, intakeId]);

  async function onPhotoChange(file: File | null) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      setPhoto(await uploadDoc(file, "IMAGE"));
      toast({ title: "ছবি আপলোড হয়েছে" });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onDocumentAdd(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      for (const file of Array.from(files).slice(0, 5)) {
        const uploaded = await uploadDoc(file, "DOCUMENT");
        setDocuments((list) => [...list, uploaded]);
      }
      toast({ title: "ডকুমেন্ট আপলোড হয়েছে" });
    } catch (error) {
      toast({ title: (error as Error).message, variant: "destructive" });
    } finally {
      setUploadingDoc(false);
    }
  }

  async function onSubmit() {
    if (submitting) return;
    if (!loggedIn) {
      toast({ title: bn ? "আবেদন করতে আগে লগইন করুন" : "Please sign in first" });
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          intakeId,
          fullNameBn,
          fullNameEn,
          fatherName,
          motherName,
          birthDate: birthDate || null,
          phone,
          email: email || "",
          presentAddress,
          permanentAddress,
          guardianName,
          guardianPhone,
          guardianRelation,
          photoMediaId: photo?.mediaId ?? null,
          documents: documents.map((doc) => ({ mediaId: doc.mediaId, type: doc.docType })),
          declarationAccepted: declaration,
          education: education
            .filter((row) => row.level.trim().length > 0)
            .map((row, i) => ({
              level: row.level,
              institution: row.institution,
              groupOrSubject: row.groupOrSubject,
              year: row.year ? Number(row.year) : null,
              result: row.result,
              sortOrder: i,
            })),
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { trackingNo: string };
        fields?: Record<string, string>;
      };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "জমা দেওয়া যায়নি", variant: "destructive" });
        return;
      }
      router.push(`/account?application=${json.data?.trackingNo ?? ""}`);
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন" : "Network error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* intake */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
          <GraduationCap aria-hidden className="h-5 w-5 text-primary" />
          {bn ? "কোর্স ও ইনটেক নির্বাচন" : "Course & intake"}
        </h2>
        {intakes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {bn
              ? "এই মুহূর্তে কোনো খোলা ইনটেক নেই — নোটিশ বোর্ডে চোখ রাখুন।"
              : "No open intake right now — watch the notice board."}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {intakes.map((intake) => (
              <button
                key={intake.id}
                type="button"
                onClick={() => setIntakeId(intake.id)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  intakeId === intake.id ? "border-primary bg-primary/5 shadow-sm" : "hover:border-gold/50"
                }`}
              >
                <span className="rounded-full bg-secondary px-2 py-0.5 font-mono text-[10.5px] font-bold">
                  {intake.courseCode}
                </span>
                <p className="mt-2 text-[13.5px] font-semibold leading-snug">{bn ? intake.labelBn : intake.labelEn}</p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {intake.seatsTotal
                    ? `${bn ? "আসন" : "Seats"}: ${toBnDigits(intake.seatsTotal)} · `
                    : ""}
                  {intake.closesAt
                    ? `${bn ? "শেষ" : "Closes"}: ${new Date(intake.closesAt).toLocaleDateString(bn ? "bn-BD" : "en-GB")}`
                    : ""}
                </p>
              </button>
            ))}
          </div>
        )}
        {selectedIntake?.examDate && (
          <p className="mt-3 rounded-lg bg-gold/10 px-3.5 py-2 text-[12.5px] font-medium text-gold-foreground dark:text-gold">
            {bn ? "প্রাথমিক নির্ধারিত পরীক্ষার তারিখ" : "Provisional exam date"}:{" "}
            {new Date(selectedIntake.examDate).toLocaleDateString(bn ? "bn-BD" : "en-GB")}
          </p>
        )}
      </section>

      {/* personal */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
          <UserCheck aria-hidden className="h-5 w-5 text-primary" />
          {bn ? "ব্যক্তিগত তথ্য" : "Personal details"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">
              {bn ? "পূর্ণ নাম (বাংলা)" : "Full name (Bangla)"} <span className="text-destructive">*</span>
            </label>
            <input value={fullNameBn} onChange={(e) => setFullNameBn(e.target.value)} dir="rtl" className={inputClass} placeholder={bn ? "মোঃ আব্দুল্লাহ আল মামুন" : "বাংলায় পূর্ণ নাম"} />
          </div>
          <div>
            <label className="text-sm font-semibold">{bn ? "Full name (English)" : "Full name (English)"}</label>
            <input value={fullNameEn} onChange={(e) => setFullNameEn(e.target.value)} className={inputClass} placeholder="Md. Abdullah Al Mamun" />
          </div>
          <div>
            <label className="text-sm font-semibold">
              {bn ? "পিতার নাম" : "Father's name"} <span className="text-destructive">*</span>
            </label>
            <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} dir="rtl" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-semibold">
              {bn ? "মাতার নাম" : "Mother's name"} <span className="text-destructive">*</span>
            </label>
            <input value={motherName} onChange={(e) => setMotherName(e.target.value)} dir="rtl" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-semibold">{bn ? "জন্ম তারিখ" : "Date of birth"}</label>
            <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-semibold">
              {bn ? "মোবাইল নম্বর" : "Mobile"} <span className="text-destructive">*</span>
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="01712345678" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold">{bn ? "ইমেইল (ঐচ্ছিক)" : "Email (optional)"}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold">{bn ? "বর্তমান ঠিকানা" : "Present address"}</label>
            <textarea value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} rows={2} dir="rtl" className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-semibold">{bn ? "স্থায়ী ঠিকানা" : "Permanent address"}</label>
            <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} rows={2} dir="rtl" className={inputClass} />
          </div>
        </div>
      </section>

      {/* guardian */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">{bn ? "অভিভাবকের তথ্য" : "Guardian"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-semibold">{bn ? "অভিভাবকের নাম" : "Guardian name"}</label>
            <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} dir="rtl" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-semibold">{bn ? "মোবাইল" : "Mobile"}</label>
            <input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} dir="ltr" className={inputClass} placeholder="01712345678" />
          </div>
          <div>
            <label className="text-sm font-semibold">{bn ? "সম্পর্ক" : "Relation"}</label>
            <input value={guardianRelation} onChange={(e) => setGuardianRelation(e.target.value)} dir="rtl" className={inputClass} placeholder={bn ? "পিতা / চাচা" : "Father / Uncle"} />
          </div>
        </div>
      </section>

      {/* education */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold">{bn ? "শিক্ষাগত যোগ্যতা" : "Education"}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEducation((rows) => [...rows, { level: "", institution: "", groupOrSubject: "", year: "", result: "" }])}
            className="gap-1.5"
            disabled={education.length >= 8}
          >
            <Plus aria-hidden className="h-4 w-4" />
            {bn ? "সারি যোগ" : "Add row"}
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {education.map((row, i) => (
            <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-5">
              <input
                value={row.level}
                onChange={(e) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, level: e.target.value } : r)))}
                dir="rtl"
                placeholder={bn ? "স্তর (এসএসসি/তাকমিল…)*" : "Level (SSC/Takmil…)*"}
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={row.institution}
                onChange={(e) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, institution: e.target.value } : r)))}
                dir="rtl"
                placeholder={bn ? "প্রতিষ্ঠান" : "Institution"}
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={row.groupOrSubject}
                onChange={(e) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, groupOrSubject: e.target.value } : r)))}
                dir="rtl"
                placeholder={bn ? "গ্রুপ/বিষয়" : "Group/Subject"}
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={row.year}
                onChange={(e) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, year: e.target.value } : r)))}
                placeholder={bn ? "সাল" : "Year"}
                inputMode="numeric"
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <div className="flex gap-2">
                <input
                  value={row.result}
                  onChange={(e) => setEducation((rows) => rows.map((r, j) => (j === i ? { ...r, result: e.target.value } : r)))}
                  placeholder={bn ? "ফলাফল" : "Result"}
                  className="min-w-0 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setEducation((rows) => rows.filter((_, j) => j !== i))}
                  aria-label={bn ? "সারি মুছুন" : "Remove"}
                  className="rounded-md p-1.5 text-destructive/70 hover:bg-destructive/10"
                  disabled={education.length <= 1}
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* documents */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
          <UploadCloud aria-hidden className="h-5 w-5 text-primary" />
          {bn ? "ছবি ও ডকুমেন্ট" : "Photo & documents"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold">{bn ? "পাসপোর্ট সাইজের ছবি" : "Passport photo"}</label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3.5 py-2.5 text-sm font-medium hover:bg-secondary">
                {uploadingPhoto ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <UploadCloud aria-hidden className="h-4 w-4" />}
                {bn ? "ছবি নির্বাচন" : "Choose photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)} />
              </label>
              {photo && <span className="truncate text-[12px] text-muted-foreground">{photo.filename}</span>}
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold">{bn ? "মার্কশিট/সনদ (PDF)" : "Transcripts (PDF)"}</label>
            <div className="mt-1.5">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-3.5 py-2.5 text-sm font-medium hover:bg-secondary">
                {uploadingDoc ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <UploadCloud aria-hidden className="h-4 w-4" />}
                {bn ? "ফাইল যোগ করুন" : "Add files"}
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="sr-only"
                  onChange={(e) => onDocumentAdd(e.target.files)}
                />
              </label>
              {documents.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {documents.map((doc, i) => (
                    <li key={doc.mediaId} className="flex items-center gap-2 rounded-md bg-secondary/50 px-2.5 py-1.5 text-[12px]">
                      <span className="min-w-0 flex-1 truncate">{doc.filename}</span>
                      <label className="sr-only" htmlFor={`doc-type-${i}`}>{bn ? "ডকুমেন্টের ধরন" : "Document type"}</label>
                      <select
                        id={`doc-type-${i}`}
                        value={doc.docType}
                        onChange={(e) =>
                          setDocuments((list) => list.map((x, j) => (j === i ? { ...x, docType: e.target.value as AppDocTypeValue } : x)))
                        }
                        className="h-8 rounded-md border bg-background px-1.5 text-[11.5px] outline-none focus:border-primary/50"
                      >
                        {APP_DOC_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {bn ? opt.labelBn : opt.labelEn}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setDocuments((list) => list.filter((_, j) => j !== i))}
                        aria-label={bn ? "সরান" : "Remove"}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 aria-hidden className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 text-[11.5px] text-muted-foreground">
          {bn
            ? "ছবি (JPG/PNG, ৫MB) ও ডকুমেন্ট (PDF, ১০MB) গ্রহণযোগ্য। প্রতিটি ফাইল যাচাই করে সংরক্ষণ করা হয়।"
            : "Photos (JPG/PNG, 5MB) and documents (PDF, 10MB). Every file is content-validated."}
        </p>
      </section>

      {/* declaration */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold">{bn ? "ঘোষণাপত্র" : "Declaration"}</h2>
        <div className="mt-3 flex items-start gap-3">
          <Switch checked={declaration} onCheckedChange={setDeclaration} aria-label={bn ? "ঘোষণায় সম্মতি" : "Accept declaration"} />
          <p className="text-[13px] leading-relaxed text-muted-foreground">{bn ? declarationBn : declarationEn}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
          <Button onClick={onSubmit} disabled={submitting || !intakeId || !declaration || !fullNameBn || !fatherName || !motherName || !phone} className="gap-2 font-semibold">
            {submitting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
            {bn ? "আবেদন জমা দিন" : "Submit application"}
          </Button>
          {!loggedIn && (
            <p className="text-[12.5px] text-muted-foreground">
              {bn ? "আবেদন জমার জন্য " : "You need an account to submit — "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                {bn ? "লগইন" : "sign in"}
              </Link>
              {bn ? " করুন বা " : " or "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                {bn ? "নতুন অ্যাকাউন্ট" : "register"}
              </Link>
              {bn ? " খুলুন।" : "."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
