"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Images, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";
import { cn } from "@/lib/utils";
import { adminConfirm } from "@/components/admin/ui/confirm";

export interface AlbumImageRow {
  id: string;
  mediaId: string;
  key: string;
  filename: string;
  captionBn: string;
  captionEn: string;
  sortOrder: number;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Images manager inside the album editor — add, reorder, caption, remove. */
export function AlbumImagesManager({ albumId, images }: { albumId: string; images: AlbumImageRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<AlbumImageRow[]>(images);
  const [captions, setCaptions] = useState<Record<string, { bn: string; en: string }>>(
    Object.fromEntries(images.map((img) => [img.id, { bn: img.captionBn, en: img.captionEn }])),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [moving, setMoving] = useState(false);

  function patchCaption(id: string, patch: Partial<{ bn: string; en: string }>) {
    setCaptions((prev) => ({ ...prev, [id]: { bn: prev[id]?.bn ?? "", en: prev[id]?.en ?? "", ...patch } }));
  }

  async function addImages(media: PickedMedia[]) {
    if (adding || media.length === 0) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/albums/${albumId}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ mediaIds: media.map((m) => m.id) }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { added: number } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "ছবি যোগ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: `${formatNumber(json.data?.added ?? 0, "bn")} টি ছবি যোগ হয়েছে` });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  }

  async function saveCaption(row: AlbumImageRow) {
    if (busyId) return;
    const caption = captions[row.id] ?? { bn: "", en: "" };
    if (caption.bn === row.captionBn && caption.en === row.captionEn) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/album-images/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ captionBn: caption.bn.trim(), captionEn: caption.en.trim() }),
      });
      if (!res.ok) {
        toast({ title: "ক্যাপশন সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, ...caption } : r)));
      toast({ title: "ক্যাপশন সংরক্ষিত" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length || moving) return;
    const current = rows[index];
    const neighbor = rows[target];
    setMoving(true);
    try {
      // swap the two sortOrder values in one round-trip pair
      const [a, b] = await Promise.all([
        fetch(`/api/admin/album-images/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
          body: JSON.stringify({ sortOrder: neighbor.sortOrder }),
        }),
        fetch(`/api/admin/album-images/${neighbor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
      if (!a.ok || !b.ok) {
        toast({ title: "ক্রম বদলানো যায়নি", variant: "destructive" });
        router.refresh();
        return;
      }
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      setRows(next);
      router.refresh();
    } finally {
      setMoving(false);
    }
  }

  async function remove(row: AlbumImageRow) {
    if (busyId) return;
    if (!(await adminConfirm({ title: `'${row.filename}' ছবিটি অ্যালবাম থেকে সরানো হবে (মিডিয়া লাইব্রেরিতে থাকবে)। নিশ্চিত?` }))) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/album-images/${row.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      if (!res.ok) {
        toast({ title: "সরানো যায়নি", variant: "destructive" });
        return;
      }
      setRows((list) => list.filter((r) => r.id !== row.id));
      toast({ title: "ছবি সরানো হয়েছে" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading flex items-center gap-2 text-base font-bold">
            <Images aria-hidden className="h-4 w-4 text-primary" />
            ছবিসমূহ
          </h2>
          <p className="text-[11.5px] text-muted-foreground">
            মোট {formatNumber(rows.length, "bn")} টি — লাইব্রেরি থেকে যোগ করুন, ক্রম বদলান, ক্যাপশন লিখুন।
          </p>
        </div>
        <div className={cn(adding && "pointer-events-none opacity-60")}>
          <MediaPicker
            multi
            label={adding ? "যোগ হচ্ছে…" : "ছবি যোগ করুন"}
            current={null}
            onSelectMany={(media) => void addImages(media)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          এই অ্যালবামে এখনো কোনো ছবি নেই — উপরের বাটন থেকে মিডিয়া লাইব্রেরি থেকে বা নতুন আপলোড করে যোগ করুন।
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row, index) => {
            const caption = captions[row.id] ?? { bn: row.captionBn, en: row.captionEn };
            const dirty = caption.bn !== row.captionBn || caption.en !== row.captionEn;
            return (
              <li key={row.id} className="flex flex-wrap items-start gap-3 rounded-xl border bg-background/50 p-3">
                <div className="flex shrink-0 flex-col pt-1">
                  <button
                    type="button"
                    onClick={() => void move(index, -1)}
                    disabled={index === 0 || moving}
                    aria-label={`${row.filename} উপরে নিন`}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronUp aria-hidden className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(index, 1)}
                    disabled={index === rows.length - 1 || moving}
                    aria-label={`${row.filename} নিচে নামান`}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ChevronDown aria-hidden className="h-4 w-4" />
                  </button>
                </div>
                <img src={`/api/media/${row.key}`} alt={row.captionBn || row.filename} className="h-20 w-28 shrink-0 rounded-lg object-cover" />
                <div className="min-w-48 flex-1 space-y-1.5">
                  <p className="truncate text-[12.5px] font-semibold">{row.filename}</p>
                  <input
                    value={caption.bn}
                    onChange={(e) => patchCaption(row.id, { bn: e.target.value })}
                    placeholder="ক্যাপশন (বাংলা)"
                    aria-label={`${row.filename} — বাংলা ক্যাপশন`}
                    className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-primary/50"
                  />
                  <input
                    value={caption.en}
                    onChange={(e) => patchCaption(row.id, { en: e.target.value })}
                    placeholder="Caption (English)"
                    aria-label={`${row.filename} — English caption`}
                    className="w-full rounded-lg border bg-card px-2.5 py-1.5 text-[12px] outline-none focus:border-primary/50"
                  />
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => void saveCaption(row)}
                      disabled={busyId === row.id || !dirty}
                      className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11.5px] font-semibold hover:bg-secondary disabled:opacity-40"
                    >
                      {busyId === row.id ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Check aria-hidden className="h-3 w-3" />}
                      ক্যাপশন সংরক্ষণ
                    </button>
                    <span className="text-[10.5px] text-muted-foreground">ক্রম {formatNumber(row.sortOrder, "bn")}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(row)}
                  disabled={busyId === row.id}
                  aria-label={`${row.filename} সরিয়ে ফেলুন`}
                  className="inline-flex shrink-0 items-center rounded-lg border border-destructive/30 px-2 py-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                >
                  {busyId === row.id ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Trash2 aria-hidden className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > 0 && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Plus aria-hidden className="mr-1 inline h-3 w-3" />
          নতুন ছবি সবসময় তালিকার শেষে যোগ হয় — তারপর উপরে-নিচে বোতামে ক্রম ঠিক করুন।
        </p>
      )}
    </section>
  );
}
