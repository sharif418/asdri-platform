"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, Loader2, Megaphone, Pencil, Pin, PinOff, Plus, Search, Trash2 } from "lucide-react";
import { adminCategoryLabel, adminPinnedLabel, adminStatusBadgeClass, adminStatusLabel } from "@/components/admin/admin-types";
import type { AdminNoticeData } from "@/components/admin/admin-types";
import { formatDate, formatNumber } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Language } from "@/types";

interface NoticeTableProps {
  notices: AdminNoticeData[];
  lang: Language;
}

/** Searchable management table for notices with edit / view / delete actions. */
export function NoticeTable({ notices, lang }: NoticeTableProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Optimistic removals — survives Router Cache staleness until server re-render. */
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  /** Optimistic pin toggles — applied instantly, refreshed from the server row on re-render. */
  const [pinnedPatches, setPinnedPatches] = useState<Map<string, boolean>>(() => new Map());
  const [pinningId, setPinningId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const base = notices
      .filter((notice) => !deletedIds.has(notice.id))
      .map((notice) => {
        const patched = pinnedPatches.get(notice.id);
        return patched === undefined ? notice : { ...notice, pinned: patched };
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.publishedAt.localeCompare(a.publishedAt);
      });
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (notice) =>
        notice.titleBn.toLowerCase().includes(q) ||
        notice.titleEn.toLowerCase().includes(q) ||
        notice.slug.toLowerCase().includes(q),
    );
  }, [notices, query, deletedIds, pinnedPatches]);

  const confirmNotice = notices.find((notice) => notice.id === confirmId) ?? null;

  /** Instant, non-destructive pin toggle — no confirm dialog, toast feedback. */
  async function onTogglePin(notice: AdminNoticeData): Promise<void> {
    if (pinningId) return;
    setPinningId(notice.id);
    const next = !notice.pinned;
    try {
      const res = await fetch(`/api/admin/notices/${notice.id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: next }),
      });
      const payload: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: payload.error ?? (bn ? "পিন স্ট্যাটাস বদলানো যায়নি" : "Pin toggle failed"), variant: "destructive" });
        return;
      }
      toast({ title: payload.data?.message ?? (next ? (bn ? "নোটিশ পিন করা হয়েছে" : "Notice pinned") : bn ? "নোটিশ আনপিন করা হয়েছে" : "Notice unpinned") });
      setPinnedPatches((prev) => {
        const nextMap = new Map(prev);
        nextMap.set(notice.id, next);
        return nextMap;
      });
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
    } finally {
      setPinningId(null);
    }
  }

  async function onDelete(): Promise<void> {
    if (!confirmId || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/notices/${confirmId}`, { method: "DELETE" });
      const payload: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: payload.error ?? (bn ? "মুছে ফেলা যায়নি" : "Delete failed"), variant: "destructive" });
        return;
      }
      toast({ title: payload.data?.message ?? (bn ? "নোটিশ মুছে ফেলা হয়েছে" : "Notice deleted") });
      const removedId = confirmId;
      setConfirmId(null);
      if (removedId) {
        setDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(removedId);
          return next;
        });
      }
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section aria-label={bn ? "নোটিশ তালিকা" : "Notice list"} className="space-y-4">
      {/* Toolbar: search + create */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={bn ? "শিরোনাম বা স্লাগ দিয়ে খুঁজুন…" : "Search by title or slug…"}
            aria-label={bn ? "নোটিশ খুঁজুন" : "Search notices"}
            className="min-h-11 pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <p aria-live="polite" className="whitespace-nowrap text-[12.5px] text-muted-foreground">
            {bn ? `${formatNumber(filtered.length, lang)} / ${formatNumber(notices.length, lang)} টি নোটিশ` : `${filtered.length} / ${notices.length} notices`}
          </p>
          <Button asChild className="min-h-11 gap-2 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90">
            <Link href="/admin/notices/new">
              <Plus aria-hidden className="h-4 w-4" />
              {bn ? "নতুন নোটিশ তৈরি করুন" : "Create Notice"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Table / empty state */}
      <div className="rounded-2xl border bg-card shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Megaphone className="h-6 w-6" />
            </span>
            <p className="mt-4 text-[15px] font-semibold">
              {notices.length === 0
                ? bn
                  ? "এখনো কোনো নোটিশ নেই"
                  : "No notices yet"
                : bn
                  ? "কোনো নোটিশ মেলেনি"
                  : "No matching notices"}
            </p>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              {notices.length === 0
                ? bn
                  ? "প্রথম বিজ্ঞপ্তিটি তৈরি করুন — এটি সরাসরি প্রকাশ্য নোটিশ বোর্ডে দেখাবে।"
                  : "Create the first notice — it will appear on the public board instantly."
                : bn
                  ? "অন্য শব্দ দিয়ে আবার খুঁজে দেখুন।"
                  : "Try a different search term."}
            </p>
            {notices.length === 0 ? (
              <Button asChild className="mt-5 min-h-11 gap-2 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90">
                <Link href="/admin/notices/new">
                  <Plus aria-hidden className="h-4 w-4" />
                  {bn ? "নতুন নোটিশ তৈরি করুন" : "Create Notice"}
                </Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <Table className="min-w-[680px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 text-[12px]">{bn ? "শিরোনাম" : "Title"}</TableHead>
                  <TableHead className="text-[12px]">{bn ? "ক্যাটেগরি" : "Category"}</TableHead>
                  <TableHead className="text-[12px]">{bn ? "স্ট্যাটাস" : "Status"}</TableHead>
                  <TableHead className="text-[12px]">{bn ? "প্রকাশের তারিখ" : "Published"}</TableHead>
                  <TableHead className="pr-5 text-right text-[12px]">{bn ? "অ্যাকশন" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((notice) => (
                  <TableRow key={notice.id} className="text-[13px]">
                    <TableCell className="max-w-[300px] pl-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/notices/${notice.id}`}
                          className="font-semibold leading-snug hover:text-primary hover:underline"
                        >
                          {notice.titleBn}
                        </Link>
                        {notice.pinned ? (
                          <Badge variant="outline" className="gap-1 border-gold/40 bg-gold/15 text-[10px] font-semibold text-gold">
                            <Pin aria-hidden className="h-3 w-3" />
                            {adminPinnedLabel(lang)}
                          </Badge>
                        ) : null}
                      </div>
                      <p dir="ltr" className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {notice.titleEn}
                      </p>
                      <p dir="ltr" className="mt-0.5 truncate font-mono text-[10.5px] text-muted-foreground/70">
                        /{notice.slug}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[10.5px] font-semibold text-primary dark:text-gold">
                        {adminCategoryLabel(notice.category, lang)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10.5px] font-semibold", adminStatusBadgeClass(notice.status))}>
                        {adminStatusLabel(notice.status, lang)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(notice.publishedAt, lang)}
                    </TableCell>
                    <TableCell className="pr-5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void onTogglePin(notice)}
                          disabled={pinningId !== null}
                          className={cn(
                            "h-10 w-10 p-0",
                            notice.pinned
                              ? "bg-gold/10 text-gold hover:bg-gold/20"
                              : "text-muted-foreground hover:bg-gold/10 hover:text-gold",
                          )}
                          title={notice.pinned ? (bn ? "আনপিন করুন" : "Unpin notice") : bn ? "পিন করুন" : "Pin notice"}
                        >
                          {pinningId === notice.id ? (
                            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                          ) : notice.pinned ? (
                            <Pin aria-hidden className="h-4 w-4 fill-gold" />
                          ) : (
                            <PinOff aria-hidden className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {notice.pinned ? (bn ? "আনপিন করুন" : "Unpin notice") : bn ? "পিন করুন" : "Pin notice"}
                          </span>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-primary hover:bg-primary/10"
                          title={bn ? "প্রকাশ্য সাইটে দেখুন" : "View on public site"}
                        >
                          <Link href={`/notices?notice=${notice.slug}`} target="_blank" rel="noopener noreferrer">
                            <Eye aria-hidden className="h-4 w-4" />
                            <span className="sr-only">{bn ? "প্রকাশ্য সাইটে দেখুন" : "View on public site"}</span>
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 text-primary hover:bg-primary/10"
                          title={bn ? "সম্পাদনা করুন" : "Edit"}
                        >
                          <Link href={`/admin/notices/${notice.id}`}>
                            <Pencil aria-hidden className="h-4 w-4" />
                            <span className="sr-only">{bn ? "সম্পাদনা করুন" : "Edit"}</span>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmId(notice.id)}
                          disabled={deleting && confirmId === notice.id}
                          className="h-10 w-10 p-0 text-destructive hover:bg-destructive/10"
                          title={bn ? "মুছে ফেলুন" : "Delete"}
                        >
                          {deleting && confirmId === notice.id ? (
                            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 aria-hidden className="h-4 w-4" />
                          )}
                          <span className="sr-only">{bn ? "মুছে ফেলুন" : "Delete"}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(confirmId)} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {bn ? "নোটিশটি মুছে ফেলবেন?" : "Delete this notice?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              “{confirmNotice?.titleBn ?? ""}” —{" "}
              {bn
                ? "এটি ডাটাবেস থেকে স্থায়ভাবে মুছে যাবে এবং প্রকাশ্য নোটিশ বোর্ড থেকেও সরে যাবে। এই কাজটি ফিরিয়ে আনা যাবে না।"
                : "this permanently removes it from the database and the public board. This action cannot be undone."}
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
              {bn ? "মুছে ফেলুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
