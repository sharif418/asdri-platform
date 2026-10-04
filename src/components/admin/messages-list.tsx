"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2, Mail, MailOpen, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Contact messages inbox — expandable view + read toggle + mark-all-read. */
export function MessagesList({ messages }: { messages: MessageRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<MessageRow[]>(messages);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const unread = rows.filter((row) => !row.isRead).length;

  async function toggleRead(row: MessageRow) {
    if (busyId) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/messages/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ isRead: !row.isRead }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "স্ট্যাটাস বদলানো যায়নি", variant: "destructive" });
        return;
      }
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, isRead: !r.isRead } : r)));
      router.refresh(); // sidebar unread badge
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: MessageRow) {
    if (busyId) return;
    if (!window.confirm(`'${row.name}' এর বার্তাটি মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/messages/${row.id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken() } });
      if (!res.ok) {
        toast({ title: "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      setRows((list) => list.filter((r) => r.id !== row.id));
      toast({ title: "বার্তা মুছে ফেলা হয়েছে" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (markingAll || unread === 0) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/admin/messages/read-all", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { markedRead: number } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সম্পন্ন করা যায়নি", variant: "destructive" });
        return;
      }
      setRows((list) => list.map((r) => ({ ...r, isRead: true })));
      toast({ title: `${formatNumber(json.data?.markedRead ?? 0, "bn")} টি বার্তা পঠিত হিসেবে চিহ্নিত` });
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-secondary/30 px-4 py-2.5">
        <p className="text-[12.5px] font-semibold text-muted-foreground">
          {formatNumber(rows.length, "bn")} টি বার্তা · অপঠিত {formatNumber(unread, "bn")}
        </p>
        <button
          type="button"
          onClick={() => void markAllRead()}
          disabled={markingAll || unread === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-[12.5px] font-semibold hover:bg-secondary disabled:opacity-40"
        >
          {markingAll ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck aria-hidden className="h-3.5 w-3.5" />}
          সব পঠিত করুন
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="font-heading text-lg font-bold">ইনবক্স খালি</p>
          <p className="mt-1 text-sm text-muted-foreground">যোগাযোগ ফর্ম থেকে নতুন বার্তা এলে এখানে দেখা যাবে।</p>
        </div>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.id} className="group">
              <details className="px-4">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 py-3 [&::-webkit-details-marker]:hidden">
                  {row.isRead ? (
                    <MailOpen aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Mail aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                  )}
                  <span className={cn("min-w-0 flex-1 truncate text-[13.5px]", row.isRead ? "text-foreground/80" : "font-bold")}>
                    {row.subject || "(বিষয় নেই)"}
                  </span>
                  <span className="hidden truncate text-[12px] text-muted-foreground sm:block">{row.name}</span>
                  {!row.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="অপঠিত" />}
                  <span className="shrink-0 text-[11px] text-muted-foreground">{new Date(row.createdAt).toLocaleDateString("bn-BD")}</span>
                  <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-90">›</span>
                </summary>

                <div className="space-y-3 border-t bg-background/40 px-1 py-4">
                  <div className="grid gap-2 text-[12.5px] sm:grid-cols-2">
                    <p>
                      <span className="text-muted-foreground">নাম: </span>
                      <span className="font-medium">{row.name}</span>
                    </p>
                    <p dir="ltr">
                      <span className="text-muted-foreground">ইমেইল: </span>
                      <a href={`mailto:${row.email}`} className="font-medium text-primary hover:underline">
                        {row.email}
                      </a>
                    </p>
                    {row.phone && (
                      <p dir="ltr">
                        <span className="text-muted-foreground">ফোন: </span>
                        <a href={`tel:${row.phone}`} className="font-medium text-primary hover:underline">
                          {row.phone}
                        </a>
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">সময়: </span>
                      <span className="font-medium">{new Date(row.createdAt).toLocaleString("bn-BD")}</span>
                    </p>
                  </div>
                  <blockquote className="whitespace-pre-wrap rounded-lg border bg-card p-3.5 text-[13px] leading-relaxed" dir="auto">
                    {row.message}
                  </blockquote>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleRead(row)}
                      disabled={busyId === row.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold hover:bg-secondary disabled:opacity-40"
                    >
                      {busyId === row.id ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : null}
                      {row.isRead ? "অপঠিত করুন" : "পঠিত করুন"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(row)}
                      disabled={busyId === row.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-[12.5px] font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" />
                      মুছে ফেলুন
                    </button>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
