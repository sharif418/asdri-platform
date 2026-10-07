"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, History, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDateTimeBn } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * সংশোধনের ইতিহাস — the revision-history panel of the notice/post edit
 * pages (round 4, workstream 5). Lists who changed what when
 * (GET /api/admin/revisions); clicking a row unfolds a field-level diff
 * (before → after, red/green tint). `version` is the server-known revision
 * count — it changes after every save's router.refresh(), which refetches
 * the list without remounting the page.
 */

export type RevisionEntity = "Notice" | "Post";

interface RevisionRow {
  id: string;
  createdAt: string;
  actor: { name: string; email: string } | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed: string[];
}

/** Bengali labels for the captured content fields. */
const FIELD_LABELS: Record<string, string> = {
  titleBn: "শিরোনাম (বাংলা)",
  titleEn: "শিরোনাম (ইংরেজি)",
  excerptBn: "সংক্ষিপ্ত বিবরণ (বাংলা)",
  excerptEn: "সংক্ষিপ্ত বিবরণ (ইংরেজি)",
  bodyBn: "মূল লেখা (বাংলা)",
  bodyEn: "মূল লেখা (ইংরেজি)",
  category: "ক্যাটাগরি",
  categoryId: "ক্যাটাগরি",
  status: "অবস্থা",
  isPublished: "প্রকাশনা",
  publishedAt: "প্রকাশের সময়",
};

function fieldLabel(field: string): string {
  return FIELD_LABELS[field] ?? field;
}

/** Human text for a stored snapshot value (HTML stripped, capped). */
function displayValue(field: string, value: unknown): string {
  if (field === "isPublished") return value ? "প্রকাশিত" : "ড্রাফট";
  if (field === "publishedAt" && typeof value === "string" && value) return formatDateTimeBn(value);
  if (value === null || value === undefined) return "—";
  if (value === "") return "(খালি)";
  if (typeof value === "boolean") return value ? "হ্যাঁ" : "না";
  const text = String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "—";
  return text.length > 280 ? `${text.slice(0, 280)}…` : text;
}

export function RevisionHistory({
  entity,
  entityId,
  version,
}: {
  entity: RevisionEntity;
  entityId: string;
  /** Revision count from the server — bumps after each save, refetches. */
  version: number;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RevisionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/revisions?entity=${entity}&entityId=${encodeURIComponent(entityId)}`);
      const json = (await res.json()) as { ok: boolean; data?: { revisions: RevisionRow[] }; error?: string };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "ইতিহাস আনা যায়নি", variant: "destructive" });
        return;
      }
      setRows(json.data.revisions);
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [entity, entityId]);

  // Initial load + reload whenever the server-known count changes (post-save).
  useEffect(() => {
    if (open || version > 0) void load();
  }, [load, open, version]);

  return (
    <section className="mt-8 rounded-2xl border bg-card shadow-sm" aria-label="সংশোধনের ইতিহাস">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2.5">
          <History aria-hidden className="h-5 w-5 text-primary" />
          <span className="font-heading text-base font-bold">সংশোধনের ইতিহাস</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {version} টি
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t px-5 py-4">
          {loading && rows === null ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              লোড হচ্ছে…
            </p>
          ) : !rows || rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">এখনো কোনো সংশোধন নেই — প্রথম সংরক্ষণের পর এখানে ইতিহাস জমা হবে।</p>
          ) : (
            <div className="space-y-2">
              {rows.length >= 20 && (
                <p className="text-[11px] text-muted-foreground">সর্বশেষ ২০টি সংশোধন দেখানো হচ্ছে (প্রতি আইটেমে সর্বোচ্চ ৫০টি সংরক্ষিত থাকে)।</p>
              )}
              {rows.map((row) => {
                const expanded = expandedId === row.id;
                return (
                  <div key={row.id} className="overflow-hidden rounded-xl border">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : row.id)}
                      aria-expanded={expanded}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 bg-background/40 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                    >
                      <span className="text-[13px] font-semibold tabular-nums">{formatDateTimeBn(row.createdAt)}</span>
                      <span className="text-[13px] text-muted-foreground">{row.actor?.name ?? "—"}</span>
                      <span className="ml-auto flex flex-wrap items-center gap-1">
                        {row.changed.length === 0 ? (
                          <span className="text-[11px] text-muted-foreground">কোনো ফিল্ড বদলায়নি</span>
                        ) : (
                          row.changed.map((field) => (
                            <span
                              key={field}
                              className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-[#7a5c15] dark:text-gold"
                            >
                              {fieldLabel(field)}
                            </span>
                          ))
                        )}
                      </span>
                      <ChevronDown
                        aria-hidden
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")}
                      />
                    </button>

                    {expanded && (
                      <div className="border-t bg-background/20 px-4 py-4">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          ফিল্ড-ভিত্তিক পরিবর্তন — {formatDateTimeBn(row.createdAt)}
                          {row.actor ? ` · ${row.actor.name}` : ""}
                        </p>
                        {row.changed.length === 0 ? (
                          <p className="text-sm text-muted-foreground">এই সংরক্ষণে কনটেন্ট ফিল্ডের কোনো পরিবর্তন ছিল না।</p>
                        ) : (
                          <dl className="space-y-3">
                            {row.changed.map((field) => (
                              <div key={field} className="rounded-lg border p-3">
                                <dt className="text-[12px] font-bold">{fieldLabel(field)}</dt>
                                <dd className="mt-2 grid gap-2 sm:grid-cols-2">
                                  <div className="rounded-md border border-red-300/50 bg-red-50 px-3 py-2 text-[13px] leading-relaxed text-foreground/90 dark:border-red-500/30 dark:bg-red-950/40">
                                    <span className="mb-0.5 block text-[10.5px] font-bold uppercase tracking-wide text-red-700 dark:text-red-400">
                                      আগে
                                    </span>
                                    {displayValue(field, row.before?.[field])}
                                  </div>
                                  <div className="rounded-md border border-emerald-300/50 bg-emerald-50 px-3 py-2 text-[13px] leading-relaxed text-foreground/90 dark:border-emerald-500/30 dark:bg-emerald-950/40">
                                    <span className="mb-0.5 block text-[10.5px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                                      পরে
                                    </span>
                                    {displayValue(field, row.after?.[field])}
                                  </div>
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
