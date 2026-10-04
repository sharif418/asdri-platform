"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** What a picker consumer needs to know about the chosen image. */
export interface PickedMedia {
  id: string;
  filename: string;
  key: string;
  width?: number | null;
  height?: number | null;
  size?: number;
}

interface PickerRow extends PickedMedia {
  altBn: string;
  altEn: string;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Fetch one page of IMAGE media for the picker grid. */
async function fetchImages(q: string, signal?: AbortSignal): Promise<PickerRow[]> {
  const params = new URLSearchParams({ kind: "IMAGE" });
  if (q) params.set("q", q);
  const res = await fetch(`/api/admin/media?${params.toString()}`, { signal });
  if (!res.ok) return [];
  const json = (await res.json()) as { ok: boolean; data?: { items: PickerRow[] } };
  return json.ok && json.data ? json.data.items : [];
}

/**
 * Media picker — a modal that lists IMAGE media from the library (with
 * search + upload) and returns the chosen row. Used for person photos,
 * post/album covers. `onSelect(null)` clears the reference. `multi` mode
 * keeps a selection set and returns everything on confirm (gallery).
 */
export function MediaPicker({
  label = "ছবি নির্বাচন",
  current,
  onSelect,
  multi = false,
  onSelectMany,
  compact = false,
}: {
  label?: string;
  current: PickedMedia | null;
  onSelect?: (media: PickedMedia | null) => void;
  multi?: boolean;
  onSelectMany?: (media: PickedMedia[]) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<Map<string, PickedMedia>>(new Map());
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (query: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      setItems(await fetchImages(query, signal));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => void load(q, controller.signal), q ? 250 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, q, load]);

  async function onUpload(file: File) {
    if (uploading) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken() },
        body: form,
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: PickerRow };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "আপলোড করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ছবি আপলোড হয়েছে" });
      await load(q);
      if (multi) {
        setSelected((prev) => new Map(prev).set(json.data!.id, json.data!));
      } else {
        onSelect?.(json.data);
        setOpen(false);
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className={cn("flex flex-wrap items-center gap-2", compact && "flex-nowrap")}>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
          <ImageIcon aria-hidden className="h-3.5 w-3.5" />
          {label}
        </Button>
        {!multi && current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSelect?.(null)}
            className="gap-1.5 text-muted-foreground"
          >
            <Trash2 aria-hidden className="h-3.5 w-3.5" />
            খুলে ফেলুন
          </Button>
        )}
      </div>

      {!multi && current && (
        <div className="flex items-center gap-3 rounded-lg border bg-secondary/30 p-2">
          <img
            src={`/api/media/${current.key}`}
            alt={current.filename}
            className="h-12 w-12 rounded-md object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium">{current.filename}</p>
            <p className="text-[11px] text-muted-foreground">
              {current.width && current.height ? `${current.width}×${current.height}` : ""}
              {current.size ? ` · ${formatBytes(current.size, "bn")}` : ""}
            </p>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>মিডিয়া লাইব্রেরি — ছবি নির্বাচন</DialogTitle>
            <DialogDescription>আপলোড করা ছবির মধ্য থেকে বেছে নিন, অথবা নতুন ছবি আপলোড করুন।</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ফাইলনাম বা বিকল্প টেক্সট দিয়ে খুঁজুন…"
                className="w-full rounded-lg border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void onUpload(file);
              }}
            />
            <Button type="button" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1.5">
              {uploading ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Upload aria-hidden className="h-3.5 w-3.5" />}
              আপলোড
            </Button>
          </div>

          <div className="scrollbar-thin max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                <Loader2 aria-hidden className="mx-auto h-5 w-5 animate-spin" />
              </div>
            ) : items.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                কোনো ছবি পাওয়া যায়নি — আপলোড বাটন থেকে নতুন ছবি যোগ করুন।
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {items.map((item) => {
                  const isSelected = selected.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (multi) {
                          setSelected((prev) => {
                            const next = new Map(prev);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.set(item.id, item);
                            return next;
                          });
                        } else {
                          onSelect?.(item);
                          setOpen(false);
                        }
                      }}
                      className={cn(
                        "group overflow-hidden rounded-lg border text-left transition-colors hover:border-gold/60",
                        isSelected && "border-gold ring-2 ring-gold/40",
                      )}
                    >
                      <img
                        src={`/api/media/${item.key}`}
                        alt={item.altBn || item.filename}
                        className="h-28 w-full bg-secondary/40 object-cover transition-opacity group-hover:opacity-90"
                      />
                      <p className="truncate px-2 py-1.5 text-[11px] font-medium">
                        {isSelected ? "✓ " : ""}
                        {item.filename}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {multi && (
            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-[12px] text-muted-foreground">{selected.size} টি নির্বাচিত</span>
              <Button
                type="button"
                size="sm"
                disabled={selected.size === 0}
                onClick={() => {
                  onSelectMany?.(Array.from(selected.values()));
                  setSelected(new Map());
                  setOpen(false);
                }}
              >
                যোগ করুন ({selected.size})
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
