"use client";

import { Loader2, Save, Sparkles, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import type { CourseMetaDraft } from "./types";

/** Section 1 — course identity, descriptions and publication switches. */
export function MetaSection({
  meta,
  setMetaField,
  saving,
  onSave,
}: {
  meta: CourseMetaDraft;
  setMetaField: <K extends keyof CourseMetaDraft>(key: K, value: CourseMetaDraft[K]) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading flex items-center gap-2 text-lg font-bold">
          <BookOpenCheck aria-hidden className="h-5 w-5 text-primary" />
          কোর্সের মূল তথ্য
        </h2>
        <div className="flex items-center gap-3">
          <LanguageStatus hasBn={meta.titleBn.length > 2} hasEn={meta.titleEn.length > 2} />
          <Button onClick={onSave} disabled={saving} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
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
                <RichTextEditor value={meta.overviewBn} onChange={(v) => setMetaField("overviewBn", v)} label="কোর্স পরিচিতি" />
              ) : (
                <RichTextEditor value={meta.overviewEn} onChange={(v) => setMetaField("overviewEn", v)} label="Course overview" />
              )
            }
          </BilingualField>

          <BilingualField label="লক্ষ্য-উদ্দেশ্য" hint="বুলেট তালিকা হিসেবে লিখুন — ওয়েবসাইটে তালিকা আকারে দেখানো হবে।">
            {(active) =>
              active === "bn" ? (
                <RichTextEditor value={meta.objectivesBn} onChange={(v) => setMetaField("objectivesBn", v)} label="লক্ষ্য-উদ্দেশ্য" minHeight={120} />
              ) : (
                <RichTextEditor value={meta.objectivesEn} onChange={(v) => setMetaField("objectivesEn", v)} label="Objectives" minHeight={120} />
              )
            }
          </BilingualField>

          <BilingualField label="ভর্তির যোগ্যতা">
            {(active) =>
              active === "bn" ? (
                <RichTextEditor value={meta.eligibilityBn} onChange={(v) => setMetaField("eligibilityBn", v)} label="ভর্তির যোগ্যতা" minHeight={120} />
              ) : (
                <RichTextEditor value={meta.eligibilityEn} onChange={(v) => setMetaField("eligibilityEn", v)} label="Eligibility" minHeight={120} />
              )
            }
          </BilingualField>

          <BilingualField label="কোর্স সম্পন্নকারীদের ভবিষ্যৎ">
            {(active) =>
              active === "bn" ? (
                <RichTextEditor value={meta.careerBn} onChange={(v) => setMetaField("careerBn", v)} label="কোর্স সম্পন্নকারীদের ভবিষ্যৎ" minHeight={120} />
              ) : (
                <RichTextEditor value={meta.careerEn} onChange={(v) => setMetaField("careerEn", v)} label="Career prospects" minHeight={120} />
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
  );
}
