"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2, RefreshCw, RotateCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { outboxKindLabel } from "@/lib/finance-labels";
import { formatDate, toBnDigits } from "@/lib/format";

export interface OutboxRowData {
  id: string;
  kind: string;
  to: string;
  subject: string;
  body: string;
  html: string;
  attempts: number;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

function OutboxViewDialog({ email }: { email: OutboxRowData }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${email.subject} দেখুন`}
          title="দেখুন"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Eye aria-hidden className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left text-base">{email.subject}</DialogTitle>
          <DialogDescription className="text-left">
            {outboxKindLabel(email.kind)} · <span dir="ltr">{email.to}</span> · {formatDate(email.createdAt, "bn")}
            {email.sentAt ? " · পাঠানো হয়েছে" : " · কিউতে"}
          </DialogDescription>
        </DialogHeader>

        {email.error ? (
          <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-[12.5px] font-medium text-destructive">
            সর্বশেষ ব্যর্থতা: {email.error}
          </p>
        ) : null}

        {/* Rendered email preview — the HTML is our own template output, but
            it is displayed inside a fully-sandboxed iframe (no scripts, no
            same-origin) instead of dangerouslySetInnerHTML. */}
        <div className="scrollbar-thin max-h-[52vh] overflow-y-auto rounded-xl border bg-white">
          <iframe
            title={`${email.subject} — ইমেইল প্রিভিউ`}
            srcDoc={email.html}
            sandbox=""
            className="h-[380px] w-full border-0"
            loading="lazy"
          />
        </div>

        <details className="rounded-lg border bg-muted/40 p-3">
          <summary className="cursor-pointer text-[12px] font-semibold text-muted-foreground">প্লেইন-টেক্সট বডি</summary>
          <pre className="scrollbar-thin mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-[11.5px] leading-relaxed">{email.body}</pre>
        </details>
      </DialogContent>
    </Dialog>
  );
}

/** Outbox email viewer — read-mostly table with a safe preview, re-queue and retry-now. */
export function OutboxTable({ emails }: { emails: OutboxRowData[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function onAction(email: OutboxRowData, action: "resend" | "retry") {
    if (busyId) return;
    setBusyId(email.id);
    try {
      const res = await fetch(`/api/admin/outbox/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        data?: { queued?: boolean; email?: { sentAt: string | null; error: string | null } };
      };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "কাজটি করা যায়নি", variant: "destructive" });
        return;
      }
      if (action === "retry") {
        const retried = json.data?.email;
        if (retried?.error) {
          toast({ title: `পাঠানো ব্যর্থ — ${retried.error.slice(0, 80)}`, variant: "destructive" });
        } else {
          toast({ title: "ইমেইলটি আবার পাঠানোর চেষ্টা সম্পন্ন হয়েছে" });
        }
      } else {
        toast({ title: "ইমেইল আবার কিউতে যোগ হয়েছে" });
      }
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  if (emails.length === 0) {
    return (
      <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
        <p className="font-heading text-lg font-bold">আউটবক্স খালি</p>
        <p className="mt-1 text-sm text-muted-foreground">
          অনুদান সম্পন্ন হলে বা ভর্তি পরীক্ষার চিঠি পাঠালে ইমেইলগুলো এখানে জমা হবে।
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-clip rounded-2xl border bg-card shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-semibold">ধরন</th>
            <th className="px-4 py-3 font-semibold">প্রাপক ও বিষয়</th>
            <th className="hidden px-4 py-3 font-semibold md:table-cell">তৈরি</th>
            <th className="px-4 py-3 font-semibold">অবস্থা</th>
            <th className="hidden px-4 py-3 font-semibold sm:table-cell">চেষ্টা</th>
            <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {emails.map((email) => {
            const busy = busyId === email.id;
            return (
              <tr key={email.id} className="transition-colors hover:bg-secondary/20">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">{outboxKindLabel(email.kind)}</span>
                </td>
                <td className="max-w-sm px-4 py-3">
                  <p className="truncate text-[12.5px] font-medium" dir="ltr">
                    {email.subject}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
                    → {email.to}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-[12px] text-muted-foreground md:table-cell">{formatDate(email.createdAt, "bn")}</td>
                <td className="px-4 py-3">
                  {email.error ? (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10.5px] font-bold text-destructive" title={email.error}>
                      ব্যর্থ
                    </span>
                  ) : email.sentAt ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10.5px] font-bold text-primary">পাঠানো</span>
                  ) : (
                    <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10.5px] font-bold text-gold">কিউতে</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell" title="পাঠানোর চেষ্টা কতবার">
                  <span className="text-[12px] tabular-nums text-muted-foreground">{toBnDigits(email.attempts)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    {busy ? (
                      <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <OutboxViewDialog email={email} />
                        {(email.error || !email.sentAt) && (
                          <button
                            type="button"
                            onClick={() => onAction(email, "retry")}
                            aria-label={`${email.subject} এখনই আবার পাঠান`}
                            title="এখনই আবার পাঠান (ড্রাইভার দিয়ে এখনই ডেলিভারি চেষ্টা)"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          >
                            <RotateCw aria-hidden className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onAction(email, "resend")}
                          aria-label={`${email.subject} আবার কিউতে পাঠান`}
                          title="আবার কিউতে পাঠান (smtp ড্রাইভারের জন্য)"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <RefreshCw aria-hidden className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { OutboxViewDialog };
