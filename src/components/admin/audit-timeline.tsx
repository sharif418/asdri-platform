"use client";

import { useMemo, useState } from "react";
import {
  BookMarked,
  HandHeart,
  History,
  Inbox,
  Megaphone,
  MessageSquareText,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Send,
  Target,
  Trash2,
  Users,
} from "lucide-react";
import type { AdminAuditEntryData } from "@/components/admin/admin-types";
import { daysAgoLabel, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Language } from "@/types";

type GroupKey = "all" | "notice" | "fatwa" | "message" | "subscriber" | "campaign" | "donation";

interface AuditTimelineProps {
  entries: AdminAuditEntryData[];
  lang: Language;
}

interface GroupStyle {
  icon: typeof Megaphone;
  chipClass: string;
  labelBn: string;
  labelEn: string;
}

const GROUP_STYLES: Record<Exclude<GroupKey, "all">, GroupStyle> = {
  notice: {
    icon: Megaphone,
    chipClass: "border-primary/30 bg-primary/10 text-primary dark:text-gold",
    labelBn: "নোটিশ",
    labelEn: "Notices",
  },
  fatwa: {
    icon: MessageSquareText,
    chipClass: "border-gold/40 bg-gold/15 text-gold",
    labelBn: "ফতোয়া",
    labelEn: "Fatwa",
  },
  message: {
    icon: Inbox,
    chipClass: "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    labelBn: "বার্তা",
    labelEn: "Messages",
  },
  subscriber: {
    icon: Users,
    chipClass: "border-border bg-muted text-muted-foreground",
    labelBn: "সাবস্ক্রাইবার",
    labelEn: "Subscribers",
  },
  campaign: {
    icon: Target,
    chipClass: "border-gold/40 bg-gold/15 text-gold",
    labelBn: "ক্যাম্পেইন",
    labelEn: "Campaigns",
  },
  donation: {
    icon: HandHeart,
    chipClass: "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    labelBn: "অনুদান",
    labelEn: "Donations",
  },
};

/** Verb + tone per raw action string (drives the chip color on the timeline). */
function actionVerb(action: string): { icon: typeof Plus; chipClass: string; verbBn: string } {
  const verb = action.split(".")[1] ?? "";
  switch (verb) {
    case "create":
      return { icon: Plus, chipClass: "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", verbBn: "তৈরি" };
    case "update":
      return { icon: Pencil, chipClass: "border-gold/40 bg-gold/15 text-gold", verbBn: "সম্পাদনা" };
    case "delete":
      return { icon: Trash2, chipClass: "border-destructive/40 bg-destructive/10 text-destructive", verbBn: "মুছে ফেলা" };
    case "answer":
      return { icon: MessageSquareText, chipClass: "border-primary/30 bg-primary/10 text-primary dark:text-gold", verbBn: "উত্তর" };
    case "publish":
      return { icon: BookMarked, chipClass: "border-gold/50 bg-gold/20 text-gold", verbBn: "প্রকাশ" };
    case "status":
      return { icon: Send, chipClass: "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400", verbBn: "স্ট্যাটাস" };
    case "pin":
      return { icon: Pin, chipClass: "border-gold/40 bg-gold/15 text-gold", verbBn: "পিন" };
    case "unpin":
      return { icon: PinOff, chipClass: "border-border bg-muted text-muted-foreground", verbBn: "আনপিন" };
    default:
      return { icon: History, chipClass: "border-border bg-muted text-muted-foreground", verbBn: verb };
  }
}

/** Read-only accountability timeline with group filter chips. */
export function AuditTimeline({ entries, lang }: AuditTimelineProps) {
  const bn = lang === "bn";
  const [group, setGroup] = useState<GroupKey>("all");

  const counts = useMemo(() => {
    const next: Record<GroupKey, number> = {
      all: entries.length,
      notice: 0,
      fatwa: 0,
      message: 0,
      subscriber: 0,
      campaign: 0,
      donation: 0,
    };
    for (const entry of entries) {
      const key = entry.action.split(".")[0] as Exclude<GroupKey, "all">;
      if (key in GROUP_STYLES) next[key] += 1;
    }
    return next;
  }, [entries]);

  const filtered = useMemo(() => {
    if (group === "all") return entries;
    return entries.filter((entry) => entry.action.startsWith(`${group}.`));
  }, [entries, group]);

  const chips: { key: GroupKey; label: string }[] = [
    { key: "all", label: bn ? "সব" : "All" },
    ...(Object.keys(GROUP_STYLES) as Exclude<GroupKey, "all">[]).map((key) => ({
      key,
      label: bn ? GROUP_STYLES[key].labelBn : GROUP_STYLES[key].labelEn,
    })),
  ];

  return (
    <section aria-label={bn ? "অ্যাডমিন কার্যক্রম লগ" : "Admin activity log"} className="space-y-5">
      {/* Group filter chips */}
      <div role="group" aria-label={bn ? "ধরন ফিল্টার" : "Type filter"} className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => {
          const active = group === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => setGroup(chip.key)}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[12.5px] font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-gold/50 hover:text-primary",
              )}
            >
              {chip.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10.5px] font-bold", active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
                {counts[chip.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <History className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">
            {entries.length === 0
              ? bn
                ? "এখনো কোনো অ্যাডমিন কার্যক্রম নেই"
                : "No admin activity recorded yet"
              : bn
                ? "এই ফিল্টারে কোনো রেকর্ড নেই"
                : "No records under this filter"}
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            {bn
              ? "নোটিশ, ফতোয়া, বার্তা, ক্যাম্পেইন, অনুদান বা সাবস্ক্রাইবার সংক্রান্ত প্রতিটি পরিবর্তন স্বয়ংক্রিয়ভাবে এখানে লিপিবদ্ধ হবে।"
              : "Every change to notices, fatwas, messages, campaigns, donations, or subscribers is recorded here automatically."}
          </p>
        </div>
      ) : (
        <ol className="relative space-y-0 border-l-2 border-dashed border-gold/30 pl-0">
          {filtered.map((entry) => {
            const groupKey = entry.action.split(".")[0] as Exclude<GroupKey, "all">;
            const style = groupKey in GROUP_STYLES ? GROUP_STYLES[groupKey] : GROUP_STYLES.subscriber;
            const GroupIcon = style.icon;
            const verb = actionVerb(entry.action);
            const VerbIcon = verb.icon;
            return (
              <li key={entry.id} className="relative pb-6 pl-6 last:pb-0 sm:pl-8">
                {/* Node medallion on the rail */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -left-[1.4rem] top-0 flex h-9 w-9 items-center justify-center rounded-full border bg-card shadow-sm sm:-left-[1.65rem]",
                    style.chipClass,
                  )}
                >
                  <GroupIcon className="h-4 w-4" />
                </span>

                <div className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-gold/40 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold", verb.chipClass)}>
                      <VerbIcon aria-hidden className="h-3 w-3" />
                      {verb.verbBn}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(entry.createdAt, lang)} · {daysAgoLabel(entry.createdAt, lang)}
                    </span>
                    <span className="ml-auto rounded-full bg-muted px-2.5 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                      {bn ? "কর্তা" : "by"} {entry.actorName}
                    </span>
                  </div>

                  <p className="mt-2.5 text-[13.5px] font-medium leading-relaxed">{entry.summaryBn}</p>

                  <p dir="ltr" className="mt-1.5 truncate font-mono text-[10.5px] text-muted-foreground/80" title={`${entry.action} · ${entry.entityRef}`}>
                    {entry.action} · {entry.entityRef.length > 22 ? `${entry.entityRef.slice(0, 22)}…` : entry.entityRef}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
