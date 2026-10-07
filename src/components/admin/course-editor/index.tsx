"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { MetaSection } from "./meta-section";
import { CurriculumSection } from "./curriculum-section";
import { SpecializationsSection, SdpSection } from "./list-sections";
import { csrfHeader } from "./types";
import type { CourseEditorValues, CourseMetaDraft, SpecDraft, SdpDraft, SemesterDraft } from "./types";

export { type CourseEditorValues, type CourseMetaDraft, type SemesterDraft, type SpecDraft, type SdpDraft } from "./types";

/* ————— the editor (state owner + save orchestration) ————— */

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

  function setMetaField<K extends keyof CourseMetaDraft>(key: K, value: CourseMetaDraft[K]) {
    setMeta((m) => ({ ...m, [key]: value }));
  }

  async function saveMeta() {
    if (savingMeta) return;
    setSavingMeta(true);
    try {
      // `cover` is preview-only state (r4 M5) — the API takes coverMediaId.
      const { cover, ...metaPayload } = meta;
      void cover;
      const res = await fetch(`/api/admin/courses/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify(metaPayload),
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

  return (
    <div className="space-y-10">
      <MetaSection meta={meta} setMetaField={setMetaField} saving={savingMeta} onSave={saveMeta} />
      <CurriculumSection semesters={semesters} setSemesters={setSemesters} saving={savingCurriculum} onSave={saveCurriculum} />
      <SpecializationsSection specs={specs} setSpecs={setSpecs} saving={savingSpecs} onSave={saveSpecs} />
      <SdpSection sdp={sdp} setSdp={setSdp} saving={savingSdp} onSave={saveSdp} />

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
