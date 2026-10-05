"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";
import { PUBLICATION_KINDS } from "@/lib/validators/admin-research";
import { adminConfirm } from "@/components/admin/ui/confirm";

export interface PublicationFormValues {
  id?: string;
  titleBn: string;
  titleEn: string;
  abstractBn: string;
  abstractEn: string;
  authorsBn: string;
  authorsEn: string;
  kind: (typeof PUBLICATION_KINDS)[number];
  year: number;
  isbn: string;
  issn: string;
  sortOrder: number;
  isPublished: boolean;
}

const KIND_LABELS: Record<(typeof PUBLICATION_KINDS)[number], string> = {
  JOURNAL: "জার্নাল",
  MAGAZINE: "ম্যাগাজিন",
  BULLETIN: "বুলেটিন",
  BOOK: "বই",
  PAPER: "রিসার্চ পেপার",
};

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Shared create/edit form for publications — cover + PDF via media picker. */
export function PublicationForm({
  initial,
  initialCover,
  initialFile,
  mode,
}: {
  initial: PublicationFormValues;
  initialCover: PickedMedia | null;
  initialFile: PickedMedia | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<PublicationFormValues>(initial);
  const [cover, setCover] = useState<PickedMedia | null>(initialCover);
  const [file, setFile] = useState<PickedMedia | null>(initialFile);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const slug = mode === "create" ? slugifyTitle(values.titleEn) || slugifyTitle(values.titleBn) || "publication" : values.id ?? "";

  function set<K extends keyof PublicationFormValues>(key: K, value: PublicationFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (values.titleBn.trim().length < 3) {
      toast({ title: "বাংলা শিরোনাম কমপক্ষে ৩ অক্ষরের হতে হবে।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        abstractBn: sanitizeRichTextPreview(values.abstractBn),
        abstractEn: sanitizeRichTextPreview(values.abstractEn),
        authorsBn: values.authorsBn,
        authorsEn: values.authorsEn,
        kind: values.kind,
        year: values.year,
        isbn: values.isbn.trim(),
        issn: values.issn.trim(),
        sortOrder: values.sortOrder,
        isPublished: values.isPublished,
        coverMediaId: cover?.id ?? null,
        fileMediaId: file?.id ?? null,
      };
      const res = await fetch(mode === "create" ? "/api/admin/publications" : `/api/admin/publications/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { id: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? Object.values(json.fields ?? {})[0] ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "প্রকাশনা তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.id) {
        router.push(`/admin/research/publications/${json.data.id}`);
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
    if (!(await adminConfirm({ title: `'${values.titleBn}' স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/publications/${values.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      if (res.ok) {
        toast({ title: "প্রকাশনা মুছে ফেলা হয়েছে" });
        router.push("/admin/research/publications");
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
        <BilingualField label="শিরোনাম" required>
          {(active) => (
            <>
              {active === "bn" ? (
                <input
                  value={values.titleBn}
                  onChange={(e) => set("titleBn", e.target.value)}
                  placeholder="বাংলা শিরোনাম"
                  required
                  className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
                />
              ) : (
                <input
                  value={values.titleEn}
                  onChange={(e) => set("titleEn", e.target.value)}
                  placeholder="English title"
                  dir="ltr"
                  className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                />
              )}
            </>
          )}
        </BilingualField>

        <BilingualField label="সারসংক্ষেপ (অ্যাবস্ট্রাক্ট)" hint="পাঠক কার্ডে ও পাঠ-ডায়ালগে দেখানো হয় — সাধারণ টেক্সট।">
          {(active) => (
            <textarea
              value={active === "bn" ? values.abstractBn : values.abstractEn}
              onChange={(e) => set(active === "bn" ? "abstractBn" : "abstractEn", e.target.value)}
              rows={4}
             
              placeholder={active === "bn" ? "২–৪ লাইনের সারসংক্ষেপ" : "2–4 line abstract"}
              className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>

        <BilingualField label="লেখকবৃন্দ" hint="কমা দিয়ে একাধিক নাম দিন।">
          {(active) => (
            <input
              value={active === "bn" ? values.authorsBn : values.authorsEn}
              onChange={(e) => set(active === "bn" ? "authorsBn" : "authorsEn", e.target.value)}
             
              placeholder={active === "bn" ? "যেমন: ড. আবু বকর, মুহাম্মদ সালিহ" : "e.g. Dr. Abu Bakr, Muhammad Salih"}
              className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          )}
        </BilingualField>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label className="text-sm font-semibold">ধরন</label>
          <select
            value={values.kind}
            onChange={(e) => set("kind", e.target.value as PublicationFormValues["kind"])}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {PUBLICATION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">প্রকাশের সাল</label>
          <input
            type="number"
            min={1950}
            max={2100}
            value={values.year}
            onChange={(e) => set("year", Number.parseInt(e.target.value, 10) || new Date().getFullYear())}
            dir="ltr"
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-semibold">ISSN</label>
            <input
              value={values.issn}
              onChange={(e) => set("issn", e.target.value)}
              dir="ltr"
              placeholder="2227-xxxx"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">ISBN</label>
            <input
              value={values.isbn}
              onChange={(e) => set("isbn", e.target.value)}
              dir="ltr"
              placeholder="978-…"
              className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-[13px] outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">প্রচ্ছদ (ছবি)</label>
          <div className="mt-1.5">
            <MediaPicker current={cover} onSelect={(media) => setCover(media)} label="প্রচ্ছদ নির্বাচন" compact />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">পিডিএফ ফাইল</label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">পাঠক এখান থেকেই ডাউনলোড করবেন।</p>
          <div className="mt-1.5">
            <MediaPicker current={file} onSelect={(media) => setFile(media)} kind="DOCUMENT" compact />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">ক্রম</label>
          <input
            type="number"
            min={0}
            max={999}
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number.parseInt(e.target.value, 10) || 0)}
            dir="ltr"
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে শুধু ড্রাফট</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div className="border-t pt-4">
          <p className="text-[11px] text-muted-foreground" dir="ltr">
            {mode === "create" ? "স্লাগ স্বয়ংক্রিয়" : ""} {slug && mode === "create" ? <code className="rounded bg-secondary px-1">{slug}</code> : ""}
          </p>
          <div className="mt-1">
            <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={onSave} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "প্রকাশনা তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/research/publications" target="_blank" className="gap-1.5 text-muted-foreground">
                  ওয়েবসাইটে দেখুন ↗
                </Link>
              </Button>
              <Button onClick={onDelete} disabled={deleting} variant="destructive" size="sm" className="w-full gap-1.5">
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
