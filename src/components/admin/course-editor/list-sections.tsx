"use client";

import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminConfirm } from "@/components/admin/ui/confirm";
import type { SpecDraft, SdpDraft } from "./types";

/** Section 3 — তাখাসসুস (specialization) list. */
export function SpecializationsSection({
  specs,
  setSpecs,
  saving,
  onSave,
}: {
  specs: SpecDraft[];
  setSpecs: React.Dispatch<React.SetStateAction<SpecDraft[]>>;
  saving: boolean;
  onSave: () => void;
}) {
  async function removeSpec(index: number) {
    const spec = specs[index];
    if (!spec) return;
    const name = spec.nameBn.trim() || spec.nameEn.trim() || "শিরোনামহীন বিভাগ";
    const confirmed = await adminConfirm({
      title: `‘${name}’ বিভাগটি মুছে ফেলা হবে।`,
      description: "সংরক্ষণ করলে আর ফেরানো যাবে না।",
      confirmLabel: "মুছে ফেলুন",
    });
    if (!confirmed) return;
    setSpecs((list) => list.filter((_, j) => j !== index));
  }

  return (
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
          <Button onClick={onSave} disabled={saving} size="sm" className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
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
              onClick={() => void removeSpec(i)}
              disabled={saving}
              aria-label="মুছুন"
              className="rounded p-1.5 text-destructive/70 hover:bg-destructive/10 disabled:opacity-40"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
            </button>
          </div>
        ))}
        {specs.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">এই কোর্সে কোনো তাখাসসুস বিভাগ নেই।</p>}
      </div>
    </section>
  );
}

/** Section 4 — শিক্ষার্থী উন্নয়ন কার্যক্রম (Student Development Programs). */
export function SdpSection({
  sdp,
  setSdp,
  saving,
  onSave,
}: {
  sdp: SdpDraft[];
  setSdp: React.Dispatch<React.SetStateAction<SdpDraft[]>>;
  saving: boolean;
  onSave: () => void;
}) {
  async function removeSdp(index: number) {
    const program = sdp[index];
    if (!program) return;
    const name = program.titleBn.trim() || "শিরোনামহীন কার্যক্রম";
    const confirmed = await adminConfirm({
      title: `‘${name}’ কার্যক্রমটি মুছে ফেলা হবে।`,
      description: "সংরক্ষণ করলে আর ফেরানো যাবে না।",
      confirmLabel: "মুছে ফেলুন",
    });
    if (!confirmed) return;
    setSdp((list) => list.filter((_, j) => j !== index));
  }

  return (
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
          <Button onClick={onSave} disabled={saving} size="sm" className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
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
                onClick={() => void removeSdp(i)}
                disabled={saving}
                aria-label="মুছুন"
                className="rounded p-1.5 text-destructive/70 hover:bg-destructive/10 disabled:opacity-40"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {sdp.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">কোনো উন্নয়ন কার্যক্রম যুক্ত নেই।</p>}
      </div>
    </section>
  );
}
