"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCheck,
  ChevronDown,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Phone,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import {
  adminContactStatusBadgeClass,
  adminContactStatusLabel,
} from "@/components/admin/admin-types";
import type { AdminContactMessageData } from "@/components/admin/admin-types";
import { daysAgoLabel, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

type Message = AdminContactMessageData;

type FilterKey = "all" | "new" | "read" | "replied";

interface MessageInboxProps {
  messages: AdminContactMessageData[];
  lang: Language;
}

/** One inbox card: sender meta, subject, expandable body, and status actions. */
function MessageCard({
  message,
  lang,
  onStatusChange,
  onDeleteRequest,
  busy,
}: {
  message: Message;
  lang: Language;
  onStatusChange: (message: Message, status: Message["status"]) => void;
  onDeleteRequest: (message: Message) => void;
  busy: boolean;
}) {
  const bn = lang === "bn";
  const isNew = message.status === "new";

  return (
    <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:border-gold/40">
      <div aria-hidden className={cn("h-1", isNew ? "bg-gold-gradient" : "bg-primary/40")} />
      <div className="p-4 sm:p-5">
        {/* Subject + status + date */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("text-[10.5px] font-semibold", adminContactStatusBadgeClass(message.status))}>
                {message.status === "new" ? (
                  <Mail aria-hidden className="mr-1 h-3 w-3" />
                ) : message.status === "read" ? (
                  <MailOpen aria-hidden className="mr-1 h-3 w-3" />
                ) : (
                  <Reply aria-hidden className="mr-1 h-3 w-3" />
                )}
                {adminContactStatusLabel(message.status, lang)}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {formatDate(message.createdAt, lang)} · {daysAgoLabel(message.createdAt, lang)}
              </span>
            </div>
            <h3 className={cn("mt-2 flex items-center gap-2 text-[14.5px] font-bold leading-snug", isNew && "text-primary dark:text-gold")}>
              {isNew ? (
                <span aria-hidden className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
                </span>
              ) : null}
              {message.subject}
            </h3>
          </div>
        </div>

        {/* Sender row */}
        <div className="mt-3 rounded-xl bg-muted/50 px-3.5 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
            <span className="font-semibold">{message.name}</span>
            <a
              href={`mailto:${message.email}`}
              dir="ltr"
              className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline dark:hover:text-gold"
            >
              <Mail aria-hidden className="h-3 w-3" />
              {message.email}
            </a>
            {message.phone ? (
              <a
                href={`tel:${message.phone}`}
                dir="ltr"
                className="inline-flex items-center gap-1 text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline dark:hover:text-gold"
              >
                <Phone aria-hidden className="h-3 w-3" />
                {message.phone}
              </a>
            ) : null}
          </div>
        </div>

        {/* Body */}
        <Collapsible className="mt-3.5">
          <CollapsibleTrigger className="group flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 text-left text-[12.5px] font-bold text-primary transition-colors hover:bg-primary/10 dark:text-gold">
            <span className="line-clamp-1 text-ellipsis">
              {message.message.split(/\n+/)[0]?.slice(0, 120) ?? ""}
            </span>
            <ChevronDown aria-hidden className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 space-y-2 rounded-xl bg-parchment/60 p-4 text-[13px] leading-[1.85] text-foreground/90 dark:bg-muted/40">
              {message.message
                .split(/\n+/)
                .map((paragraph) => paragraph.trim())
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed pt-3.5">
          <div className="flex flex-wrap items-center gap-2">
            {message.status !== "read" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(message, "read")}
                disabled={busy}
                className="min-h-10 gap-1.5 border-primary/30 px-3.5 text-[12px] font-semibold text-primary hover:bg-primary/10 dark:text-gold"
              >
                <MailOpen aria-hidden className="h-3.5 w-3.5" />
                {bn ? "পঠিত হিসেবে চিহ্নিত" : "Mark read"}
              </Button>
            ) : null}
            {message.status !== "replied" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(message, "replied")}
                disabled={busy}
                className="min-h-10 gap-1.5 border-emerald-600/40 bg-emerald-500/5 px-3.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400"
              >
                {busy ? (
                  <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck aria-hidden className="h-3.5 w-3.5" />
                )}
                {bn ? "উত্তর দেওয়া হয়েছে" : "Mark replied"}
              </Button>
            ) : null}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteRequest(message)}
            disabled={busy}
            aria-label={bn ? "বার্তা মুছে ফেলুন" : "Delete message"}
            className="min-h-10 gap-1.5 border-destructive/40 px-3.5 text-[12px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 aria-hidden className="h-3.5 w-3.5" />
            {bn ? "মুছে ফেলুন" : "Delete"}
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Contact inbox with status filter chips, sender search, and status/delete actions. */
export function MessageInbox({ messages, lang }: MessageInboxProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteFor, setDeleteFor] = useState<Message | null>(null);
  const [deleting, setDeleting] = useState(false);
  /** Optimistic status patches + removals — survive Router Cache staleness. */
  const [statusPatches, setStatusPatches] = useState<Map<string, Message["status"]>>(() => new Map());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  const effective = useMemo(() => {
    if (statusPatches.size === 0 && deletedIds.size === 0) return messages;
    return messages
      .filter((message) => !deletedIds.has(message.id))
      .map((message) => {
        const patch = statusPatches.get(message.id);
        return patch ? { ...message, status: patch } : message;
      });
  }, [messages, statusPatches, deletedIds]);

  const counts = useMemo(
    () => ({
      all: effective.length,
      new: effective.filter((message) => message.status === "new").length,
      read: effective.filter((message) => message.status === "read").length,
      replied: effective.filter((message) => message.status === "replied").length,
    }),
    [effective],
  );

  const needle = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    let list = effective;
    if (filter !== "all") list = list.filter((message) => message.status === filter);
    if (needle) {
      list = list.filter((message) =>
        [message.name, message.email, message.subject, message.message]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    return list;
  }, [effective, filter, needle]);

  const chips: { key: FilterKey; labelBn: string; labelEn: string }[] = [
    { key: "all", labelBn: "সব", labelEn: "All" },
    { key: "new", labelBn: "নতুন", labelEn: "New" },
    { key: "read", labelBn: "পঠিত", labelEn: "Read" },
    { key: "replied", labelBn: "উত্তরপ্রাপ্ত", labelEn: "Replied" },
  ];

  async function onStatusChange(message: Message, status: Message["status"]): Promise<void> {
    if (busyId) return;
    setBusyId(message.id);
    try {
      const res = await fetch(`/api/admin/messages/${message.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: payload.error ?? (bn ? "স্ট্যাটাস বদলানো যায়নি" : "Status update failed"), variant: "destructive" });
        return;
      }
      setStatusPatches((prev) => {
        const next = new Map(prev);
        next.set(message.id, status);
        return next;
      });
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(): Promise<void> {
    if (!deleteFor || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/messages/${deleteFor.id}`, { method: "DELETE" });
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
    <section aria-label={bn ? "যোগাযোগ বার্তাবক্স" : "Contact inbox"} className="space-y-4">
      {/* Search + filter chips */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={bn ? "নাম, ইমেইল বা বিষয় খুঁজুন…" : "Search name, email, or subject…"}
            aria-label={bn ? "বার্তা অনুসন্ধান" : "Search messages"}
            className="h-11 pl-9 text-[13.5px]"
          />
        </div>
        <div role="group" aria-label={bn ? "স্ট্যাটাস ফিল্টার" : "Status filter"} className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => {
            const active = filter === chip.key;
            const count = counts[chip.key];
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(chip.key)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[12.5px] font-semibold transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-gold/50 hover:text-primary",
                )}
              >
                {bn ? chip.labelBn : chip.labelEn}
                <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px] font-bold", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Inbox className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">
            {messages.length === 0
              ? bn
                ? "এখনো কোনো বার্তা আসেনি"
                : "No messages yet"
              : bn
                ? "এই ফিল্টারে কোনো বার্তা নেই"
                : "No messages under this filter"}
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            {bn
              ? "“যোগাযোগ” পৃষ্ঠার ফর্ম থেকে পাঠানো বার্তাগুলো এখানে জমা হবে।"
              : "Messages sent from the contact page form will arrive here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              lang={lang}
              onStatusChange={(target, status) => void onStatusChange(target, status)}
              onDeleteRequest={setDeleteFor}
              busy={busyId === message.id}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteFor)} onOpenChange={(open) => !open && setDeleteFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              {bn ? "বার্তাটি মুছে ফেলবেন?" : "Delete this message?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {bn
                ? `${deleteFor?.name ?? ""}-এর “${deleteFor?.subject ?? ""}” বার্তাটি স্থায়ভাবে মুছে যাবে। এই কাজটি ফিরিয়ে আনা যাবে না।`
                : `${deleteFor?.name ?? ""}'s message “${deleteFor?.subject ?? ""}” will be permanently removed. This cannot be undone.`}
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
