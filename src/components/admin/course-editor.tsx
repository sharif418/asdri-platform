"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import { toBnDigits as formatNumberBn } from "@/lib/format";

/* ————— types mirroring the API payloads ————— */

interface SubjectDraft {
  code: string;
  titleBn: string;
  titleEn: string;
  modulesBn: string;
  modulesEn: string;
  credits: number;
  marks: number;
  isNonCredit: boolean;
}

interface SemesterDraft {
  number: number;
  year: number;
  titleBn: string;
  titleEn: string;
  durationBn: string;
  durationEn: string;
  subjects: SubjectDraft[];
}

interface SpecDraft {
  nameBn: string;
  nameEn: string;
  nameAr: string;
}

interface SdpDraft {
  titleBn: string;
  titleEn: string;
  objectiveBn: string;
  objectiveEn: string;
  activitiesBn: string;
  activitiesEn: string;
  hours: number;
  outcomeBn: string;
  outcomeEn: string;
}

export interface CourseMetaDraft {
  code: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  taglineBn: string;
  taglineEn: string;
  overviewBn: string;
  overviewEn: string;
  objectivesBn: string;
  objectivesEn: string;
  eligibilityBn: string;
  eligibilityEn: string;
  careerBn: string;
  careerEn: string;
  durationBn: string;
  durationEn: string;
  courseTypeBn: string;
  courseTypeEn: string;
  seats: number | null;
  coverMediaId: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface CourseEditorValues {
  id: string;
  slug: string;
  meta: CourseMetaDraft;
  semesters: SemesterDraft[];
  specializations: SpecDraft[];
  sdp: SdpDraft[];
}

function csrfHeader(): Record<string, string> {
  return { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" };
}

/* ————— the editor ————— */

export function CourseEditor({ initial }: { initial: CourseEditorValues }) {
  const router = useRouter();
  const [meta, setMeta] = useState<CourseMetaDraft>(initial.meta);
  const [semesters, setSemesters] = useState<SemesterDraft[]>(initial.semesters);
  const [specs, setSpecs] = useState<SpecDraft[]>(initial.specializations);
  const [sdp, setSdp] = useState<SdpDraft[]>(initial.sdp);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [savingSpecs, setSavingSpecs] = useState(false);
  const [savingSdp, setSavingSdp] = useState(false);

  const totals = useMemo(() => {
    let credits = 0;
    let marks = 0;
    let subjects = 0;
    for (const sem of semesters) {
      for (const subject of sem.subjects) {
        subjects += 1;
        if (!subject.isNonCredit) credits += subject.credits;
        marks += subject.marks;
      }
    }
    return { credits, marks, subjects, semesters: semesters.length };
  }, [semesters]);

  function setMetaField<K extends keyof CourseMetaDraft>(key: K, value: CourseMetaDraft[K]) {
    setMeta((m) => ({ ...m, [key]: value }));
  }

  async function saveMeta() {
    if (savingMeta) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/admin/courses/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify(meta),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "কোর্সের তথ্য সংরক্ষিত হয়েছে" });
      router.refresh();
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveCurriculum() {
    if (savingCurriculum) return;
    setSavingCurriculum(true);
    try {
      const res = await fetch(`/api/admin/courses/${initial.id}/curriculum`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({
          semesters: semesters.map((sem, i) => ({ ...sem, number: i + 1, year: Math.floor(i / 2) + 1 })),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "কারিকুলাম সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "কারিকুলাম সংরক্ষিত — সিলেবাস টেবিল হুবহু এভাবেই ওয়েবসাইটে দেখা যাবে" });
      router.refresh();
    } finally {
      setSavingCurriculum(false);
    }
  }

  async function saveSpecs() {
    setSavingSpecs(true);
    try {
      const res = await fetch(`/api/admin/courses/${initial.id}/specializations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ specializations: specs.map((s, i) => ({ ...s, sortOrder: i })) }),
      });
      if (res.ok) toast({ title: "তাখাসসুস বিভাগ সংরক্ষিত হয়েছে" });
      else toast({ title: "সংরক্ষণ করা যায়নি", variant: "destructive" });
    } finally {
      setSavingSpecs(false);
    }
  }

  async function saveSdp() {
    setSavingSdp(true);
    try {
      const res = await fetch(`/api/admin/courses/${initial.id}/sdp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ programs: sdp.map((s, i) => ({ ...s, sortOrder: i })) }),
      });
      if (res.ok) toast({ title: "উন্নয়ন কার্যক্রম সংরক্ষিত হয়েছে" });
      else toast({ title: "সংরক্ষণ করা যায়নি", variant: "destructive" });
    } finally {
      setSavingSdp(false);
    }
  }

  /* ————— curriculum tree helpers ————— */

  function addSemester() {
    setSemesters((list) => [
      ...list,
      { number: list.length + 1, year: Math.floor(list.length / 2) + 1, titleBn: "", titleEn: "", durationBn: "", durationEn: "", subjects: [] },
    ]);
  }

  function removeSemester(index: number) {
    setSemesters((list) => list.filter((_, i) => i !== index));
  }

  function moveSemester(index: number, dir: -1 | 1) {
    setSemesters((list) => {
      const next = [...list];
      const target = index + dir;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateSemester(index: number, patch: Partial<SemesterDraft>) {
    setSemesters((list) => list.map((sem, i) => (i === index ? { ...sem, ...patch } : sem)));
  }

  function addSubject(semIndex: number) {
    setSemesters((list) =>
      list.map((sem, i) =>
        i === semIndex
          ? {
              ...sem,
              subjects: [
                ...sem.subjects,
                { code: "", titleBn: "", titleEn: "", modulesBn: "", modulesEn: "", credits: 0, marks: 100, isNonCredit: false },
              ],
            }
          : sem,
      ),
    );
  }

  function updateSubject(semIndex: number, subIndex: number, patch: Partial<SubjectDraft>) {
    setSemesters((list) =>
      list.map((sem, i) =>
        i === semIndex
          ? { ...sem, subjects: sem.subjects.map((sub, j) => (j === subIndex ? { ...sub, ...patch } : sub)) }
          : sem,
      ),
    );
  }

  function removeSubject(semIndex: number, subIndex: number) {
    setSemesters((list) =>
      list.map((sem, i) => (i === semIndex ? { ...sem, subjects: sem.subjects.filter((_, j) => j !== subIndex) } : sem)),
    );
  }

  function moveSubject(semIndex: number, subIndex: number, dir: -1 | 1) {
    setSemesters((list) =>
      list.map((sem, i) => {
        if (i !== semIndex) return sem;
        const subjects = [...sem.subjects];
        const target = subIndex + dir;
        if (target < 0 || target >= subjects.length) return sem;
        [subjects[subIndex], subjects[target]] = [subjects[target], subjects[subIndex]];
        return { ...sem, subjects };
      }),
    );
  }

  const semesterTotals = (sem: SemesterDraft) => ({
    credits: sem.subjects.reduce((s, sub) => s + (sub.isNonCredit ? 0 : sub.credits), 0),
    marks: sem.subjects.reduce((s, sub) => s + sub.marks, 0),
  });

  return (
    <div className="space-y-10">
      {/* ————— meta card ————— */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
            <BookOpenCheck aria-hidden className="h-5 w-5 text-primary" />
            কোর্সের মূল তথ্য
          </h2>
          <div className="flex items-center gap-3">
            <LanguageStatus hasBn={meta.titleBn.length > 2} hasEn={meta.titleEn.length > 2} />
            <Button onClick={saveMeta} disabled={savingMeta} className="gap-2 font-semibold">
              {savingMeta ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
              তথ্য সংরক্ষণ
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[110px_minmax(0,1fr)]">
              <div>
                <label className="text-sm font-semibold">কোড</label>
                <input
                  value={meta.code}
                  onChange={(e) => setMetaField("code", e.target.value.toUpperCase())}
                  className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
                  placeholder="PYS"
                />
              </div>
              <BilingualField label="কোর্সের নাম" required>
                {(active) =>
                  active === "bn" ? (
                    <input
                      value={meta.titleBn}
                      onChange={(e) => setMetaField("titleBn", e.target.value)}
                      placeholder="বাংলা নাম"
                      className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-[15px] font-heading"
                    />
                  ) : (
                    <input
                      value={meta.titleEn}
                      onChange={(e) => setMetaField("titleEn", e.target.value)}
                      placeholder="English name"
                      className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-[15px]"
                    />
                  )
                }
              </BilingualField>
            </div>

            <BilingualField label="আরবি নাম (ঐচ্ছিক)">
              {() => (
                <input
                  value={meta.titleAr}
                  onChange={(e) => setMetaField("titleAr", e.target.value)}
                  dir="rtl"
                  lang="ar"
                  placeholder="السنة التمهيدية"
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 font-arabic text-[15px]"
                />
              )}
            </BilingualField>

            <BilingualField label="ট্যাগলাইন">
              {(active) =>
                active === "bn" ? (
                  <input
                    value={meta.taglineBn}
                    onChange={(e) => setMetaField("taglineBn", e.target.value)}
                    placeholder="এক লাইনে কোর্সের পরিচয়"
                    className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm"
                  />
                ) : (
                  <input
                    value={meta.taglineEn}
                    onChange={(e) => setMetaField("taglineEn", e.target.value)}
                    placeholder="One-line identity"
                    className="w-full rounded-lg border bg-background px-3.5 py-2 text-sm"
                  />
                )
              }
            </BilingualField>

            <BilingualField label="কোর্স পরিচিতি (সম্পূর্ণ)">
              {(active) =>
                active === "bn" ? (
                  <RichTextEditor value={meta.overviewBn} onChange={(v) => setMetaField("overviewBn", v)} />
                ) : (
                  <RichTextEditor value={meta.overviewEn} onChange={(v) => setMetaField("overviewEn", v)} />
                )
              }
            </BilingualField>

            <BilingualField label="লক্ষ্য-উদ্দেশ্য" hint="বুলেট তালিকা হিসেবে লিখুন — ওয়েবসাইটে তালিকা আকারে দেখানো হবে।">
              {(active) =>
                active === "bn" ? (
                  <RichTextEditor value={meta.objectivesBn} onChange={(v) => setMetaField("objectivesBn", v)} minHeight={120} />
                ) : (
                  <RichTextEditor value={meta.objectivesEn} onChange={(v) => setMetaField("objectivesEn", v)} minHeight={120} />
                )
              }
            </BilingualField>

            <BilingualField label="ভর্তির যোগ্যতা">
              {(active) =>
                active === "bn" ? (
                  <RichTextEditor value={meta.eligibilityBn} onChange={(v) => setMetaField("eligibilityBn", v)} minHeight={120} />
                ) : (
                  <RichTextEditor value={meta.eligibilityEn} onChange={(v) => setMetaField("eligibilityEn", v)} minHeight={120} />
                )
              }
            </BilingualField>

            <BilingualField label="কোর্স সম্পন্নকারীদের ভবিষ্যৎ">
              {(active) =>
                active === "bn" ? (
                  <RichTextEditor value={meta.careerBn} onChange={(v) => setMetaField("careerBn", v)} minHeight={120} />
                ) : (
                  <RichTextEditor value={meta.careerEn} onChange={(v) => setMetaField("careerEn", v)} minHeight={120} />
                )
              }
            </BilingualField>
          </div>

          <aside className="space-y-4">
            <div>
              <label className="text-sm font-semibold">মেয়াদ (বাংলা)</label>
              <input
                value={meta.durationBn}
                onChange={(e) => setMetaField("durationBn", e.target.value)}
                placeholder="৩ বছর (আবাসিক)"
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Duration (EN)</label>
              <input
                value={meta.durationEn}
                onChange={(e) => setMetaField("durationEn", e.target.value)}
                placeholder="3 Years (Residential)"
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">ধরন (আবাসিক/পুরুষ-মহিলা)</label>
              <input
                value={meta.courseTypeBn}
                onChange={(e) => setMetaField("courseTypeBn", e.target.value)}
                placeholder="সম্পূর্ণ আবাসিক · শুধু পুরুষ"
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Type (EN)</label>
              <input
                value={meta.courseTypeEn}
                onChange={(e) => setMetaField("courseTypeEn", e.target.value)}
                placeholder="Residential · male only"
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-semibold">আসন সংখ্যা</label>
              <input
                type="number"
                value={meta.seats ?? ""}
                onChange={(e) => setMetaField("seats", e.target.value ? Number(e.target.value) : null)}
                placeholder="—"
                className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            <MediaPicker
              label="কভার ছবি"
              current={null}
              onSelect={(media) => setMetaField("coverMediaId", media?.id ?? null)}
            />
            {meta.coverMediaId && (
              <button
                type="button"
                onClick={() => setMetaField("coverMediaId", null)}
                className="text-[11.5px] font-semibold text-muted-foreground hover:text-destructive"
              >
                কভার সরান
              </button>
            )}

            <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <Sparkles aria-hidden className="h-3.5 w-3.5 text-gold" />
                  হোমে ফিচার
                </p>
                <p className="text-[11px] text-muted-foreground">হোমপেজের 'চলমান প্রোগ্রাম' অংশে</p>
              </div>
              <Switch checked={meta.isFeatured} onCheckedChange={(v) => setMetaField("isFeatured", v)} aria-label="ফিচার" />
            </div>
            <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold">প্রকাশিত</p>
                <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে পেজ ৪০৪ দেখাবে</p>
              </div>
              <Switch checked={meta.isPublished} onCheckedChange={(v) => setMetaField("isPublished", v)} aria-label="প্রকাশিত" />
            </div>
          </aside>
        </div>
      </section>

      {/* ————— curriculum ————— */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold">কারিকুলাম — সেমিস্টার ও বিষয়সমূহ</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              মোট {formatNumberBn(totals.semesters)} সেমিস্টার · {formatNumberBn(totals.subjects)} বিষয় ·{" "}
              {formatNumberBn(totals.credits)} ক্রেডিট · {formatNumberBn(totals.marks)} মার্ক
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={addSemester} variant="outline" size="sm" className="gap-1.5">
              <Plus aria-hidden className="h-4 w-4" />
              সেমিস্টার যোগ
            </Button>
            <Button onClick={saveCurriculum} disabled={savingCurriculum} className="gap-2 font-semibold">
              {savingCurriculum ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
              কারিকুলাম সংরক্ষণ
            </Button>
          </div>
        </div>

        {semesters.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            এখনো কোনো সেমিস্টার নেই — প্রথম সেমিস্টার যোগ করে বিষয়গুলো সাজান।
          </div>
        )}

        <div className="mt-6 space-y-6">
          {semesters.map((sem, semIndex) => {
            const st = semesterTotals(sem);
            return (
              <div key={semIndex} className="rounded-xl border">
                <div className="flex flex-wrap items-center gap-2 border-b bg-secondary/30 px-4 py-3">
                  <span className="font-heading text-sm font-bold">সেমিস্টার {formatNumberBn(semIndex + 1)}</span>
                  <input
                    value={sem.titleBn}
                    onChange={(e) => updateSemester(semIndex, { titleBn: e.target.value })}
                    placeholder="(ঐচ্ছিক শিরোনাম — যেমন: মূল কোর্স)"
                    className="min-w-40 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
                  />
                  <input
                    value={sem.titleEn}
                    onChange={(e) => updateSemester(semIndex, { titleEn: e.target.value })}
                    placeholder="(optional subtitle)"
                    className="hidden min-w-40 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-[13px] md:block"
                  />
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    {formatNumberBn(st.credits)} ক্রেডিট · {formatNumberBn(st.marks)} মার্ক
                  </span>
                  <span className="flex-1" />
                  <button type="button" onClick={() => moveSemester(semIndex, -1)} aria-label="উপরে" className="rounded p-1 text-muted-foreground hover:bg-secondary">
                    <ArrowUp aria-hidden className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveSemester(semIndex, 1)} aria-label="নিচে" className="rounded p-1 text-muted-foreground hover:bg-secondary">
                    <ArrowDown aria-hidden className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSemester(semIndex)}
                    aria-label="সেমিস্টার মুছুন"
                    className="rounded p-1 text-destructive/70 hover:bg-destructive/10"
                  >
                    <Trash2 aria-hidden className="h-4 w-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  {sem.subjects.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">এই সেমিস্টারে এখনো কোনো বিষয় নেই।</p>
                  ) : (
                    <table className="w-full min-w-[760px] text-[13px]">
                      <thead>
                        <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                          <th className="px-3 py-2 font-semibold">কোড</th>
                          <th className="px-3 py-2 font-semibold">বিষয়</th>
                          <th className="px-3 py-2 font-semibold">মডিউল (প্রতি লাইনে একটি)</th>
                          <th className="px-3 py-2 font-semibold">ক্রেডিট</th>
                          <th className="px-3 py-2 font-semibold">মার্ক</th>
                          <th className="px-3 py-2 font-semibold">নন-ক্রেডিট</th>
                          <th className="px-3 py-2" />
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sem.subjects.map((subject, subIndex) => (
                          <tr key={subIndex} className="align-top">
                            <td className="px-3 py-2">
                              <input
                                value={subject.code}
                                onChange={(e) => updateSubject(semIndex, subIndex, { code: e.target.value })}
                                placeholder="PYS 1101"
                                className="w-24 rounded-md border bg-background px-2 py-1.5 font-mono text-[12px]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={subject.titleBn}
                                onChange={(e) => updateSubject(semIndex, subIndex, { titleBn: e.target.value })}
                                placeholder="বাংলা নাম *"
                                className="w-44 rounded-md border bg-background px-2 py-1.5"
                              />
                              <input
                                value={subject.titleEn}
                                onChange={(e) => updateSubject(semIndex, subIndex, { titleEn: e.target.value })}
                                placeholder="English title"
                                className="mt-1 w-44 rounded-md border bg-background px-2 py-1.5 text-[12px]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <textarea
                                value={subject.modulesBn}
                                onChange={(e) => updateSubject(semIndex, subIndex, { modulesBn: e.target.value })}
                                rows={3}
                                placeholder="মডিউল ১&#10;মডিউল ২"
                                className="w-48 rounded-md border bg-background px-2 py-1.5 text-[12px]"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                value={subject.credits}
                                onChange={(e) => updateSubject(semIndex, subIndex, { credits: Number(e.target.value) || 0 })}
                                className="w-16 rounded-md border bg-background px-2 py-1.5 tabular-nums"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                value={subject.marks}
                                onChange={(e) => updateSubject(semIndex, subIndex, { marks: Number(e.target.value) || 0 })}
                                className="w-16 rounded-md border bg-background px-2 py-1.5 tabular-nums"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Switch
                                checked={subject.isNonCredit}
                                onCheckedChange={(v) => updateSubject(semIndex, subIndex, { isNonCredit: v })}
                                aria-label="নন-ক্রেডিট"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-col gap-1">
                                <button type="button" onClick={() => moveSubject(semIndex, subIndex, -1)} aria-label="উপরে" className="rounded p-1 text-muted-foreground hover:bg-secondary">
                                  <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => moveSubject(semIndex, subIndex, 1)} aria-label="নিচে" className="rounded p-1 text-muted-foreground hover:bg-secondary">
                                  <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeSubject(semIndex, subIndex)}
                                  aria-label="বিষয় মুছুন"
                                  className="rounded p-1 text-destructive/70 hover:bg-destructive/10"
                                >
                                  <X aria-hidden className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="border-t px-4 py-2.5">
                  <button
                    type="button"
                    onClick={() => addSubject(semIndex)}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
                  >
                    <Plus aria-hidden className="h-3.5 w-3.5" />
                    বিষয় যোগ করুন
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ————— specializations ————— */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold">তাখাসসুস (বিশেষায়িত) বিভাগসমূহ</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">PYS-এর মতো কোর্সে বিভাগ নির্বাচনের তালিকা।</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSpecs((s) => [...s, { nameBn: "", nameEn: "", nameAr: "" }])} variant="outline" size="sm" className="gap-1.5">
              <Plus aria-hidden className="h-4 w-4" />
              বিভাগ যোগ
            </Button>
            <Button onClick={saveSpecs} disabled={savingSpecs} size="sm" className="gap-2 font-semibold">
              {savingSpecs ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
              সংরক্ষণ
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {specs.map((spec, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
              <input
                value={spec.nameBn}
                onChange={(e) => setSpecs((list) => list.map((s, j) => (j === i ? { ...s, nameBn: e.target.value } : s)))}
                placeholder="বিভাগের নাম (বাংলা)"
                className="min-w-44 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={spec.nameEn}
                onChange={(e) => setSpecs((list) => list.map((s, j) => (j === i ? { ...s, nameEn: e.target.value } : s)))}
                placeholder="English"
                className="min-w-40 flex-1 rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={spec.nameAr}
                onChange={(e) => setSpecs((list) => list.map((s, j) => (j === i ? { ...s, nameAr: e.target.value } : s)))}
                dir="rtl"
                lang="ar"
                placeholder="العربية"
                className="w-36 rounded-md border bg-background px-2.5 py-1.5 text-[13px] font-arabic"
              />
              <button
                type="button"
                onClick={() => setSpecs((list) => list.filter((_, j) => j !== i))}
                aria-label="মুছুন"
                className="rounded p-1.5 text-destructive/70 hover:bg-destructive/10"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            </div>
          ))}
          {specs.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">এই কোর্সে কোনো তাখাসসুস বিভাগ নেই।</p>}
        </div>
      </section>

      {/* ————— SDP ————— */}
      <section className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold">শিক্ষার্থী উন্নয়ন কার্যক্রম (SDP)</h2>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">নৈতিকতা ও নেতৃত্ব গঠনের বাধ্যতামূলক কার্যক্রম — ক্রেডিটে ধরা হয় না।</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                setSdp((list) => [
                  ...list,
                  { titleBn: "", titleEn: "", objectiveBn: "", objectiveEn: "", activitiesBn: "", activitiesEn: "", hours: 0, outcomeBn: "", outcomeEn: "" },
                ])
              }
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <Plus aria-hidden className="h-4 w-4" />
              কার্যক্রম যোগ
            </Button>
            <Button onClick={saveSdp} disabled={savingSdp} size="sm" className="gap-2 font-semibold">
              {savingSdp ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
              সংরক্ষণ
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {sdp.map((program, i) => (
            <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                value={program.titleBn}
                onChange={(e) => setSdp((list) => list.map((p, j) => (j === i ? { ...p, titleBn: e.target.value } : p)))}
                placeholder="কার্যক্রমের নাম (বাংলা)"
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={program.titleEn}
                onChange={(e) => setSdp((list) => list.map((p, j) => (j === i ? { ...p, titleEn: e.target.value } : p)))}
                placeholder="Title (EN)"
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                value={program.objectiveBn}
                onChange={(e) => setSdp((list) => list.map((p, j) => (j === i ? { ...p, objectiveBn: e.target.value } : p)))}
                placeholder="উদ্দেশ্য"
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
              />
              <input
                type="number"
                min={0}
                value={program.hours}
                onChange={(e) => setSdp((list) => list.map((p, j) => (j === i ? { ...p, hours: Number(e.target.value) || 0 } : p)))}
                placeholder="ঘণ্টা"
                className="rounded-md border bg-background px-2.5 py-1.5 text-[13px] tabular-nums"
              />
              <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-4">
                <input
                  value={program.outcomeBn}
                  onChange={(e) => setSdp((list) => list.map((p, j) => (j === i ? { ...p, outcomeBn: e.target.value } : p)))}
                  placeholder="ফলাফল"
                  className="flex-1 rounded-md border bg-background px-2.5 py-1.5 text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => setSdp((list) => list.filter((_, j) => j !== i))}
                  aria-label="মুছুন"
                  className="rounded p-1.5 text-destructive/70 hover:bg-destructive/10"
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {sdp.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">কোনো উন্নয়ন কার্যক্রম যুক্ত নেই।</p>}
        </div>
      </section>

      <div className="flex items-center justify-between border-t pt-6 text-sm">
        <Link href="/admin/courses" className="text-muted-foreground hover:text-primary">
          ← কোর্স তালিকায় ফিরুন
        </Link>
        <Link href={`/academics/courses/${initial.slug}`} target="_blank" className="font-semibold text-primary hover:underline">
          ওয়েবসাইটে কোর্স পেজ দেখুন ↗
        </Link>
      </div>
    </div>
  );
}
