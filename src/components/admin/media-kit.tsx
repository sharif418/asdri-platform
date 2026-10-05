"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Row shape shared with the server page (JSON-serialisable). */
export interface MediaRow {
  id: string;
  key: string;
  filename: string;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  altBn: string;
  altEn: string;
  kind: "IMAGE" | "DOCUMENT";
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/* ————————— Upload panel (XHR → progress bar) ————————— */

export function MediaUploadPanel({ kind }: { kind: "IMAGE" | "DOCUMENT" }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isImage = kind === "IMAGE";

  function upload(file: File) {
    if (progress !== null) return;
    setProgress(0);
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.setRequestHeader("x-csrf-token", csrfToken());
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      try {
        const json = JSON.parse(xhr.responseText) as { ok: boolean; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && json.ok) {
          toast({ title: `${file.name} আপলোড হয়েছে` });
          router.refresh();
        } else {
          toast({ title: json.error ?? "আপলোড করা যায়নি", variant: "destructive" });
        }
      } catch {
        toast({ title: "আপলোড করা যায়নি", variant: "destructive" });
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    };
    xhr.send(form);
  }

  const accept = isImage ? "image/jpeg,image/png,image/webp" : "application/pdf";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) upload(file);
      }}
      className={cn(
        "rounded-2xl border border-dashed p-5 transition-colors",
        dragOver ? "border-gold bg-gold/5" : "bg-card",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload aria-hidden className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">{isImage ? "ছবি আপলোড করুন" : "ডকুমেন্ট (PDF) আপলোড করুন"}</p>
            <p className="text-[11.5px] text-muted-foreground">
              {isImage ? "JPG, PNG, WEBP — সর্বোচ্চ ১০MB (থাম্বনেইল স্বয়ংক্রিয়ভাবে তৈরি হয়)" : "PDF — সর্বোচ্চ ২০MB"}
              {" · "}ফাইল ড্র্যাগ করে ছাড়ুন বা বাটনে ক্লিক করুন
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) upload(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {progress !== null ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Upload aria-hidden className="h-4 w-4" />}
          ফাইল বেছে নিন
        </button>
      </div>
      {progress !== null && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

/* ————————— Media card (thumbnail + alt inline edit + delete) ————————— */

export function MediaCard({ media }: { media: MediaRow }) {
  const router = useRouter();
  const [altBn, setAltBn] = useState(media.altBn);
  const [altEn, setAltEn] = useState(media.altEn);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isImage = media.kind === "IMAGE";
  const dirty = altBn !== media.altBn || altEn !== media.altEn;

  async function saveAlt() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/media/${media.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ altBn: altBn.trim(), altEn: altEn.trim() }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "বিকল্প টেক্সট সংরক্ষিত" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (deleting) return;
    if (!window.confirm(`'${media.filename}' স্থায়ীভাবে মুছে ফেলা হবে (স্টোরেজসহ)। নিশ্চিত?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/media/${media.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি — ফাইলটি হয়তো এখনো ব্যবহৃত।", variant: "destructive" });
        return;
      }
      toast({ title: "মুছে ফেলা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col overflow-clip rounded-2xl border bg-card shadow-sm transition-colors hover:border-gold/40">
      {isImage ? (
        <img
          src={`/api/media/${media.key}`}
          alt={altBn || media.filename}
          loading="lazy"
          className="h-36 w-full bg-secondary/40 object-cover"
        />
      ) : (
        <a
          href={`/api/media/${media.key}`}
          target="_blank"
          rel="noreferrer"
          className="flex h-36 w-full items-center justify-center bg-secondary/40 text-muted-foreground transition-colors hover:text-primary"
          title="ডকুমেন্ট খুলুন"
        >
          <FileText aria-hidden className="h-10 w-10" />
        </a>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-[13px] font-semibold" title={media.filename}>
          {media.filename}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {media.width && media.height ? `${media.width}×${media.height} · ` : ""}
          {formatBytes(media.size, "bn")}
        </p>
        <div className="mt-auto space-y-1.5">
          <input
            value={altBn}
            onChange={(e) => setAltBn(e.target.value)}
            placeholder="বিকল্প টেক্সট (বাংলা)"
            dir="rtl"
            aria-label={`${media.filename} — বাংলা বিকল্প টেক্সট`}
            className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-[12px] outline-none focus:border-primary/50"
          />
          <input
            value={altEn}
            onChange={(e) => setAltEn(e.target.value)}
            placeholder="Alt text (English)"
            aria-label={`${media.filename} — English alt text`}
            className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-[12px] outline-none focus:border-primary/50"
          />
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={saveAlt}
              disabled={saving || !dirty}
              className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[12px] font-semibold transition-colors hover:bg-secondary disabled:opacity-40"
            >
              {saving ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Check aria-hidden className="h-3 w-3" />}
              বিকল্প টেক্সট সংরক্ষণ
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              aria-label={`${media.filename} মুছে ফেলুন`}
              className="inline-flex items-center justify-center rounded-lg border border-destructive/30 px-2 py-1.5 text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
            >
              {deleting ? <Loader2 aria-hidden className="h-3 w-3 animate-spin" /> : <Trash2 aria-hidden className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
