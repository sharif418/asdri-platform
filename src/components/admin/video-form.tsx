"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { youtubeThumbUrl } from "@/lib/youtube";
import { adminConfirm } from "@/components/admin/ui/confirm";
import { GeneralError, fieldId, useFieldErrors } from "@/components/admin/ui/form-errors";

export interface VideoFormValues {
  id?: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  youtubeUrl: string;
  playlistKey: string;
  sortOrder: number;
  isPublished: boolean;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

const ID_RE = /^[\w-]{11}$/;

/** Create/edit form for a video — URL or ID; the server parses the ID. */
export function VideoForm({
  initial,
  playlists,
  mode,
}: {
  initial: VideoFormValues;
  playlists: string[];
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const [values, setValues] = useState<VideoFormValues>(initial);
  const [listOptions, setListOptions] = useState<string[]>(playlists);
  const [newPlaylist, setNewPlaylist] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fe = useFieldErrors();

  function set<K extends keyof VideoFormValues>(key: K, value: VideoFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  const previewId = ID_RE.test(values.youtubeUrl.trim()) ? values.youtubeUrl.trim() : null;

  async function onSave() {
    if (saving) return;
    setSaving(true);
    fe.clear();
    try {
      const res = await fetch(mode === "create" ? "/api/admin/videos" : `/api/admin/videos/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          titleBn: values.titleBn,
          titleEn: values.titleEn,
          descriptionBn: values.descriptionBn,
          descriptionEn: values.descriptionEn,
          youtubeUrl: values.youtubeUrl.trim(),
          playlistKey: values.playlistKey.trim(),
          sortOrder: values.sortOrder,
          isPublished: values.isPublished,
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { id: string } };
      if (!res.ok || !json.ok) {
        // The videos API answers with a specific message (bad link/ID) — keep
        // it in the toast AND under the offending field via the shared hook.
        const summary = fe.setFromResponse(json) ?? "সংরক্ষণ করা যায়নি";
        toast({ title: summary, variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "ভিডিও যোগ হয়েছে" : "সংরক্ষিত হয়েছে" });
      if (mode === "create" && json.data?.id) {
        router.push(`/admin/videos/${json.data.id}`);
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
    if (!(await adminConfirm({ title: `'${values.titleBn}' ভিডিওটি তালিকা থেকে মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/videos/${values.id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken() } });
      if (res.ok) {
        toast({ title: "ভিডিও মুছে ফেলা হয়েছে" });
        router.push("/admin/videos");
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
        <GeneralError message={fe.general} />
        <BilingualField label="শিরোনাম" required>
          {(active) =>
            active === "bn" ? (
              <>
                <input
                  id={fieldId("titleBn")}
                  value={values.titleBn}
                  onChange={(e) => set("titleBn", e.target.value)}
                  placeholder="ভিডিওর বাংলা শিরোনাম"
                  aria-invalid={fe.errors.titleBn ? true : undefined}
                  required
                  className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
                />
                <fe.ErrorText name="titleBn" />
              </>
            ) : (
              <>
                <input
                  id={fieldId("titleEn")}
                  value={values.titleEn}
                  onChange={(e) => set("titleEn", e.target.value)}
                  placeholder="Video title"
                  aria-invalid={fe.errors.titleEn ? true : undefined}
                  className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                />
                <fe.ErrorText name="titleEn" />
              </>
            )
          }
        </BilingualField>

        <BilingualField label="বিবরণ" hint="প্লেলিস্টের নিচে ভিডিওর সাথে দেখানো হয়।">
          {(active) =>
            active === "bn" ? (
              <textarea
                value={values.descriptionBn}
                onChange={(e) => set("descriptionBn", e.target.value)}
                rows={3}
                placeholder="১–২ লাইনের বিবরণ"
                className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            ) : (
              <textarea
                value={values.descriptionEn}
                onChange={(e) => set("descriptionEn", e.target.value)}
                rows={3}
                placeholder="1–2 line description"
                className="w-full resize-y rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
              />
            )
          }
        </BilingualField>

        <div className="space-y-1.5">
          <label htmlFor={fieldId("youtubeUrl")} className="text-sm font-semibold">
            ইউটিউব লিংক বা ভিডিও আইডি <span className="text-destructive">*</span>
          </label>
          <input
            id={fieldId("youtubeUrl")}
            value={values.youtubeUrl}
            onChange={(e) => set("youtubeUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… অথবা dQw4w9WgXcQ"
            dir="ltr"
            aria-invalid={fe.errors.youtubeUrl ? true : undefined}
            required
            className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
          />
          <fe.ErrorText name="youtubeUrl" />
          <p className="text-[11.5px] text-muted-foreground">
            লিংক বা আইডি — সার্ভার ১১ অক্ষরের আইডি বের করে সংরক্ষণ করে (থাম্বনেইল ও এম্বেড স্বয়ংক্রিয়)।
          </p>
          {previewId && (
            <img
              src={youtubeThumbUrl(previewId)}
              alt="ভিডিও থাম্বনেইল"
              className="mt-2 h-36 w-full max-w-md rounded-lg border object-cover"
            />
          )}
        </div>
      </div>

      <aside className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm xl:sticky xl:top-20 h-fit">
        <div>
          <label htmlFor={fieldId("playlistKey")} className="text-sm font-semibold">প্লেলিস্ট</label>
          <select
            id={fieldId("playlistKey")}
            value={listOptions.includes(values.playlistKey) ? values.playlistKey : ""}
            onChange={(e) => set("playlistKey", e.target.value)}
            aria-invalid={fe.errors.playlistKey ? true : undefined}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          >
            <option value="">— প্লেলিস্ট নির্বাচন করুন —</option>
            {listOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <fe.ErrorText name="playlistKey" />
          <div className="mt-2 flex gap-1.5">
            <input
              value={newPlaylist}
              onChange={(e) => setNewPlaylist(e.target.value)}
              placeholder="নতুন প্লেলিস্টের নাম"
              aria-label="নতুন প্লেলিস্টের নাম"
              className="min-w-0 flex-1 rounded-lg border bg-card px-2.5 py-1.5 text-[12.5px] outline-none focus:border-primary/50"
            />
            <button
              type="button"
              disabled={!newPlaylist.trim()}
              onClick={() => {
                const name = newPlaylist.trim();
                setListOptions((list) => (list.includes(name) ? list : [...list, name]));
                set("playlistKey", name);
                setNewPlaylist("");
              }}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[12.5px] font-semibold hover:bg-secondary disabled:opacity-40"
            >
              <Plus aria-hidden className="h-3 w-3" />
              যোগ
            </button>
          </div>
        </div>

        <div>
          <label htmlFor={fieldId("sortOrder")} className="text-sm font-semibold">ক্রম</label>
          <input
            id={fieldId("sortOrder")}
            type="number"
            min={0}
            max={999}
            value={values.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value) || 0)}
            aria-invalid={fe.errors.sortOrder ? true : undefined}
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <fe.ErrorText name="sortOrder" />
        </div>

        <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5">
          <div>
            <p className="text-sm font-semibold">প্রকাশিত</p>
            <p className="text-[11px] text-muted-foreground">বন্ধ থাকলে ভিডিও পাতায় দেখাবে না</p>
          </div>
          <Switch checked={values.isPublished} onCheckedChange={(v) => set("isPublished", v)} aria-label="প্রকাশিত" />
        </div>

        <div className="border-t pt-4">
          <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
        </div>

        <div className="space-y-2 border-t pt-4">
          <Button onClick={() => void onSave()} disabled={saving} className="w-full gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "ভিডিও যোগ করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
          {mode === "edit" && (
            <>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/media/videos" target="_blank" className="gap-1.5 text-muted-foreground">
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
