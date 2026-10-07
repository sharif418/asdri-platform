"use client";

import { ArrowDown, ArrowUp, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toBnDigits as formatNumberBn } from "@/lib/format";
import { adminConfirm } from "@/components/admin/ui/confirm";
import type { SemesterDraft, SubjectDraft } from "./types";

/** Section 2 — the semester/subject tree (the syllabus table on the site). */
export function CurriculumSection({
  semesters,
  setSemesters,
  saving,
  onSave,
}: {
  semesters: SemesterDraft[];
  setSemesters: React.Dispatch<React.SetStateAction<SemesterDraft[]>>;
  saving: boolean;
  onSave: () => void;
}) {
  const totals = {
    credits: 0,
    marks: 0,
    subjects: 0,
    semesters: semesters.length,
  };
  for (const sem of semesters) {
    for (const subject of sem.subjects) {
      totals.subjects += 1;
      if (!subject.isNonCredit) totals.credits += subject.credits;
      totals.marks += subject.marks;
    }
  }

  function addSemester() {
    setSemesters((list) => [
      ...list,
      { number: list.length + 1, year: Math.floor(list.length / 2) + 1, titleBn: "", titleEn: "", durationBn: "", durationEn: "", subjects: [] },
    ]);
  }

  /** Display name of a semester row (optional title falls back to its number). */
  function semesterName(sem: SemesterDraft, index: number): string {
    return sem.titleBn.trim() || `সেমিস্টার ${formatNumberBn(index + 1)}`;
  }

  async function removeSemester(index: number) {
    const sem = semesters[index];
    if (!sem) return;
    const confirmed = await adminConfirm({
      title: `‘${semesterName(sem, index)}’ ও তার ${formatNumberBn(sem.subjects.length)}টি বিষয় মুছে ফেলা হবে — সংরক্ষণ করলে আর ফেরানো যাবে না।`,
      description: "এটি এখনো শুধু খসড়ায় বদল — ‘কারিকুলাম সংরক্ষণ’ না চাপলে ডেটাবেস অপরিবর্তিত থাকে।",
      confirmLabel: "মুছে ফেলুন",
    });
    if (!confirmed) return;
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

  async function removeSubject(semIndex: number, subIndex: number) {
    const subject = semesters[semIndex]?.subjects[subIndex];
    if (!subject) return;
    const name = subject.titleBn.trim() || subject.code.trim() || "শিরোনামহীন বিষয়";
    const confirmed = await adminConfirm({
      title: `‘${name}’ বিষয়টি মুছে ফেলা হবে।`,
      description: "সংরক্ষণ করলে আর ফেরানো যাবে না।",
      confirmLabel: "মুছে ফেলুন",
    });
    if (!confirmed) return;
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
          <Button onClick={onSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
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
                  onClick={() => void removeSemester(semIndex)}
                  disabled={saving}
                  aria-label="সেমিস্টার মুছুন"
                  className="rounded p-1 text-destructive/70 hover:bg-destructive/10 disabled:opacity-40"
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
                                onClick={() => void removeSubject(semIndex, subIndex)}
                                disabled={saving}
                                aria-label="বিষয় মুছুন"
                                className="rounded p-1 text-destructive/70 hover:bg-destructive/10 disabled:opacity-40"
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
  );
}
