"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";

export interface PersonFormValues {
  id?: string;
  slug?: string;
  nameBn: string;
  nameEn: string;
  titleBn: string;
  titleEn: string;
  roleTitleBn: string;
  roleTitleEn: string;
  subjectsBn: string;
  subjectsEn: string;
  bioBn: string;
  bioEn: string;
  teamId: string;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  photo: PickedMedia | null;
}

export interface TeamOption {
  id: string;
  nameBn: string;
}

/** Shared create/edit form for teachers & officers. */
export function PersonForm({ initial, teams, mode }: { initial: PersonFormValues; teams: TeamOption[]; mode: "create" | "edit" }) {
  const router = useRouter();
  const [values, setValues] = useState<PersonFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slug = useMemo(
    () => values.slug ?? (slugifyTitle(values.nameEn || values.nameBn) || "person"),
    [values.slug, values.nameEn, values.nameBn],
  );

  function set<K extends keyof PersonFormValues>(key: K, value: PersonFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        nameBn: values.nameBn,
        nameEn: values.nameEn,
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        roleTitleBn: values.roleTitleBn,
        roleTitleEn: values.roleTitleEn,
        subjectsBn: values.subjectsBn,
        subjectsEn: values.subjectsEn,
        bioBn: sanitizeRichTextPreview(values.bioBn),
        bioEn: sanitizeRichTextPreview(values.bioEn),
        teamId: values.teamId || null,
        photoMediaId: values.photo?.id ?? null,
        isPublished: values.isPublished,
        isFeatured: values.isFeatured,
        sortOrder: values.sortOrder,
        ...(mode === "create" ? { slug } : {}),
      };
      const res = await fetch(mode === "create" ? "/api/admin/people" : `/api/admin/people/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { slug: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "প্রোফাইল তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.slug) {
        router.push(`/admin/people/${json.data.slug}`);
      } else {
        router.refresh();
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (deleting || mode !== "edit" || !values.id) return;
    if (!window.confirm(`'${values.nameBn}' প্রোফাইলটি স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/people/${values.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" },
      });
      if (res.ok) {
        toast({ title: "প্রোফাইল মুছে ফেলা হয়েছে" });
        router.push("/admin/people");
      } else {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <BilingualField label="নাম" required hint="বাংলা নাম বাধ্যতামূলক; ইংরেজি খালি রাখলে বাংলাটিই দুই ভাষায় দেখানো হবে।">
          {(active) =>
            active === "bn" ? (
              <input
                value={values.nameBn}
                onChange={(e) => set("nameBn", e.target.value)}
                placeholder="বাংলা নাম"
                dir="rtl"
                required
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
              />
            ) : (
              <input
                value={values.nameEn}
                onChange={(e) => set("nameEn", e.target.value)}
                placeholder="English name"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
              />
            )
          }
        </BilingualField>

        <BilingualField label="খেতাব" hint="চেয়ারম্যান / উস্তাজ, ফিকহ — প্রোফাইল কার্ডে নামের পাশে দেখানো হয়।">
          {(active) =>
            active === "bn" ? (
              <input
                value={values.titleBn}
                onChange={(e) => set("titleBn", e.target.value)}
                placeholder="উস্তাজ, ফিকহ"
                dir="rtl"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            ) : (
              <input
                value={values.titleEn}
                onChange={(e) => set("titleEn", e.target.value)}
                placeholder="Ustadh, Fiqh"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            )
          }
        </BilingualField>

        <BilingualField label="পূর্ণ পদবি" hint="বিস্তারিত পরিচিতি পাতায় দেখানো হয়।">
          {(active) =>
            active === "bn" ? (
              <input
                value={values.roleTitleBn}
                onChange={(e) => set("roleTitleBn", e.target.value)}
                placeholder="সিনিয়র লেকচারার, ফিকহ বিভাগ"
                dir="rtl"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            ) : (
              <input
                value={values.roleTitleEn}
                onChange={(e) => set("roleTitleEn", e.target.value)}
                placeholder="Senior Lecturer, Dept. of Fiqh"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            )
          }
        </BilingualField>

        <BilingualField label="পড়ানো বিষয়সমূহ" hint="কমা দিয়ে আলাদা করুন — সাধারণ টেক্সট হিসেবে সংরক্ষিত হয়।">
          {(active) =>
            active === "bn" ? (
              <input
                value={values.subjectsBn}
                onChange={(e) => set("subjectsBn", e.target.value)}
                placeholder="উসুলুল ফিকহ, ফিকহ, আরবি"
                dir="rtl"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            ) : (
              <input
                value={values.subjectsEn}
                onChange={(e) => set("subjectsEn", e.target.value)}
                placeholder="Usul al-Fiqh, Fiqh, Arabic"
                className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            )
          }
        </BilingualField>

        <BilingualField label="জীবনবৃত্তান্ত">
          {(active) =>
            active === "bn" ? (
              <RichTextEditor value={values.bioBn} onChange={(html) => set("bioBn", html)} placeholder="শিক্ষা ও অভিজ্ঞতা…" dir="rtl" minHeight={160} />
            ) : (
              <RichTextEditor value={values.bioEn} onChange={(html) => set("bioEn", html)} placeholder="Education & experience…" minHeight={160} />
            )
          }
        </BilingualField>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label className="text-sm font-semibold">দল</label>
          <select
            value={values.teamId}
            onChange={(e) => set("teamId", e.target.value)}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">— দল নির্বাচন করুন —</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.nameBn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">ছবি</label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">মিডিয়া লাইব্রেরি থেকে বা সরাসরি আপলোড।</p>
          <div className="mt-2">
            <MediaPicker current={values.photo} onSelect={(media) => set("photo", media)} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">হোমপেজ শোকেস</p>
            <p className="text-[11px] text-muted-foreground">নেতৃত্ব শোকেস সেকশনে দেখানো হবে</p>
          </div>
          <Switch checked={values.isFeatured} onCheckedChange={(v) => set("isFeatured", v)} aria-label="হোমপেজ শোকেস" />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে ওয়েবসাইটে দেখাবে না</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div>
          <label className="text-sm font-semibold">ক্রম (sort order)</label>
          <input
            type="number"
            min={0}
            max={999}
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t pt-4">
          <p className="text-[11px] text-muted-foreground">
            স্লাগ: <code className="rounded bg-secondary px-1">{slug}</code>
          </p>
          <div className="mt-1">
            <LanguageStatus hasBn={values.nameBn.length > 2} hasEn={values.nameEn.length > 2} />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={() => void onSave()} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "প্রোফাইল তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/about/leadership" target="_blank" className="gap-1.5 text-muted-foreground">
                  ওয়েবসাইটে দেখুন ↗
                </Link>
              </Button>
              <Button onClick={() => void onDelete()} disabled={deleting} variant="destructive" size="sm" className="w-full gap-1.5">
                {deleting ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Trash2 aria-hidden className="h-3.5 w-3.5" />}
                মুছে ফেলুন
              </Button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
