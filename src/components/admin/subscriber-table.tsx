"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Download, Loader2, MailCheck, Search, Trash2, Users } from "lucide-react";
import { formatDate, toBnDigits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Language } from "@/types";

export interface AdminSubscriberRow {
  id: string;
  email: string;
  createdAt: string;
}

interface SubscriberTableProps {
  rows: AdminSubscriberRow[];
  lang: Language;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Newsletter subscriber roster with search, CSV export, and removal. */
export function SubscriberTable({ rows, lang }: SubscriberTableProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteFor, setDeleteFor] = useState<AdminSubscriberRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  /** Optimistic removals — survive Router Cache staleness. */
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  const effective = useMemo(
    () => rows.filter((row) => !deletedIds.has(row.id)),
    [rows, deletedIds],
  );

  const needle = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return effective;
    return effective.filter((row) => row.email.toLowerCase().includes(needle));
  }, [effective, needle]);

  async function onCopyAll(): Promise<void> {
    const list = filtered.map((row) => row.email).join(", ");
    if (!list) return;
    try {
      await navigator.clipboard.writeText(list);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
      toast({ title: bn ? "সব ইমেইল কপি হয়েছে" : "All emails copied" });
    } catch {
      toast({ title: bn ? "কপি করা যায়নি" : "Copy failed", variant: "destructive" });
    }
  }

  function onExportCsv(): void {
    const header = "email,subscribed_at\n";
    const body = filtered
      .map((row) => `${csvEscape(row.email)},${row.createdAt}`)
      .join("\n");
    const blob = new Blob([`\uFEFF${header}${body}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `as-sunnah-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast({ title: bn ? "CSV ডাউনলোড শুরু হয়েছে" : "CSV download started" });
  }

  async function onDelete(): Promise<void> {
    if (!deleteFor || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/subscribers/${deleteFor.id}`, { method: "DELETE" });
      const payload: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: payload.error ?? (bn ? "মুছে ফেলা যায়নি" : "Delete failed"), variant: "destructive" });
        return;
      }
      const removedId = deleteFor.id;
      setDeleteFor(null);
      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(removedId);
        return next;
      });
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-label={bn ? "সাবস্ক্রাইবার তালিকা" : "Subscriber roster"} className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={bn ? "ইমেইল খুঁজুন…" : "Search email…"}
            aria-label={bn ? "সাবস্ক্রাইবার অনুসন্ধান" : "Search subscribers"}
            className="h-11 pl-9 text-[13.5px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void onCopyAll()}
            disabled={filtered.length === 0}
            className="min-h-11 gap-2 border-primary/30 bg-primary/5 px-4 text-[12.5px] font-semibold text-primary hover:bg-primary/10 dark:text-gold"
          >
            {copied ? <MailCheck aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />}
            {bn ? `সব কপি (${toBnDigits(filtered.length)})` : `Copy all (${filtered.length})`}
          </Button>
          <Button
            onClick={onExportCsv}
            disabled={filtered.length === 0}
            className="min-h-11 gap-2 bg-gold-gradient px-4 text-[12.5px] font-bold text-gold-foreground hover:opacity-90"
          >
            <Download aria-hidden className="h-4 w-4" />
            {bn ? "CSV এক্সপোর্ট" : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Roster */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">
            {rows.length === 0
              ? bn
                ? "এখনো কোনো সাবস্ক্রাইবার নেই"
                : "No subscribers yet"
              : bn
                ? "এই অনুসন্ধানে কিছু মেলেনি"
                : "Nothing matches this search"}
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            {bn
              ? "ফুটারের নিউজলেটার ফর্ম থেকে সাবস্ক্রাইব করলে তালিকায় যুক্ত হবে।"
              : "Subscribers from the footer newsletter form will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left">
            <caption className="sr-only">
              {bn ? `মোট ${toBnDigits(filtered.length)} জন সাবস্ক্রাইবার` : `${filtered.length} subscribers`}
            </caption>
            <thead>
              <tr className="border-b bg-muted/50 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
                <th scope="col" className="px-4 py-3 sm:px-5">
                  {bn ? "ইমেইল" : "Email"}
                </th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell sm:px-5">
                  {bn ? "যোগ দিয়েছেন" : "Joined"}
                </th>
                <th scope="col" className="w-16 px-4 py-3 text-right sm:px-5">
                  <span className="sr-only">{bn ? "ক্রিয়া" : "Actions"}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row.id}
                  className="group border-b last:border-b-0 transition-colors hover:bg-muted/40"
                >
                  <td className="max-w-0 truncate px-4 py-3.5 text-[13.5px] font-medium sm:px-5" dir="ltr">
                    {row.email}
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3.5 sm:table-cell sm:px-5">
                    <span className="inline-flex rounded-full border border-border/80 bg-muted/60 px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground">
                      {formatDate(row.createdAt, lang)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right sm:px-5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteFor(row)}
                      aria-label={`${bn ? "সাবস্ক্রাইবার সরান" : "Remove subscriber"} ${row.email}`}
                      className={cn(
                        "h-9 w-9 p-0 text-muted-foreground opacity-60 transition-opacity hover:bg-destructive/10 hover:text-destructive",
                        "group-hover:opacity-100 focus-visible:opacity-100",
                      )}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t bg-muted/30 px-4 py-2.5 text-[11.5px] text-muted-foreground sm:px-5">
            {bn
              ? `দেখানো হচ্ছে ${toBnDigits(filtered.length)} / ${toBnDigits(effective.length)} সাবস্ক্রাইবার`
              : `Showing ${filtered.length} / ${effective.length} subscribers`}
          </p>
        </div>
      )}

      {/* Remove confirmation */}
      <AlertDialog open={Boolean(deleteFor)} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {bn ? "সাবস্ক্রাইবার সরাবেন?" : "Remove this subscriber?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {bn
                ? `${deleteFor?.email ?? ""} তালিকা থেকে সরে যাবে — সে চাইলে আবার নতুন করে সাবস্ক্রাইব করতে পারবে।`
                : `${deleteFor?.email ?? ""} will be removed from the list — they can subscribe again anytime.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11" disabled={deleting}>
              {bn ? "বাতিল" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void onDelete();
              }}
              disabled={deleting}
              className="min-h-11 gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden className="h-4 w-4" />}
              {bn ? "সরিয়ে ফেলুন" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
