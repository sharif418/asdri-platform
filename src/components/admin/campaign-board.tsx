"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarClock,
  Flag,
  HandHeart,
  Pencil,
  Receipt,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { CampaignEditDialog, type CampaignEditPatch } from "@/components/admin/campaign-edit-dialog";
import {
  CampaignComposerButton,
  CampaignComposerDialog,
} from "@/components/admin/campaign-composer-dialog";
import { CampaignDeleteButton } from "@/components/admin/campaign-delete-button";
import type { AdminCampaignData } from "@/components/admin/admin-types";
import { formatDate, formatTaka, toBnDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Language } from "@/types";

type CampaignPatch = Partial<Pick<AdminCampaignData, "targetAmount" | "raisedAmount" | "deadline" | "active">>;

interface CampaignBoardProps {
  campaigns: AdminCampaignData[];
  lang: Language;
}

interface CampaignCardProps {
  campaign: AdminCampaignData;
  lang: Language;
  busy: boolean;
  onToggle: (campaign: AdminCampaignData, active: boolean) => void;
  onEdit: (campaign: AdminCampaignData) => void;
  onRemove: (campaign: AdminCampaignData) => void;
}

/** One campaign card: progress, deadline, donation stats, active toggle, edit, delete. */
function CampaignCard({ campaign, lang, busy, onToggle, onEdit, onRemove }: CampaignCardProps) {
  const bn = lang === "bn";
  const title = bn ? campaign.titleBn : campaign.titleEn;
  const description = bn ? campaign.descriptionBn : campaign.descriptionEn;
  const percent =
    campaign.targetAmount > 0 ? Math.min(100, Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)) : 0;
  const deadlinePast = campaign.deadline !== null && new Date(campaign.deadline).getTime() < Date.now();

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors sm:p-6",
        campaign.active ? "hover:border-gold/40" : "opacity-80",
      )}
    >
      {/* Title + progress percent */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-heading flex items-center gap-2 text-[15px] font-semibold leading-snug">
            <Target aria-hidden className="h-4.5 w-4.5 shrink-0 text-gold" />
            {title}
          </h3>
          <p dir="ltr" className="mt-1 truncate font-mono text-[10.5px] text-muted-foreground/80">
            {campaign.slug}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold">
          {bn ? `${toBnDigits(percent)}%` : `${percent}%`}
        </span>
      </div>

      <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{description}</p>

      {/* Gold progress bar + amounts */}
      <Progress value={percent} className="mt-4 h-2.5 [&>div]:bg-gold-gradient" aria-label={`${percent}%`} />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[12.5px]">
        <span className="font-semibold text-primary dark:text-gold">
          {formatTaka(campaign.raisedAmount, lang)}{" "}
          <span className="font-normal text-muted-foreground">{bn ? "সংগৃহীত" : "raised"}</span>
        </span>
        <span className="text-muted-foreground">
          {bn ? "লক্ষ্য" : "Target"}: {formatTaka(campaign.targetAmount, lang)}
        </span>
      </div>

      {/* Deadline */}
      {campaign.deadline ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
          <CalendarClock aria-hidden className="h-3.5 w-3.5 text-gold" />
          {bn ? "সময়সীমা" : "Deadline"}: {formatDate(campaign.deadline, lang)}
          <Badge
            variant="outline"
            className={cn(
              "text-[9.5px] font-bold",
              deadlinePast
                ? "border-border bg-muted text-muted-foreground"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            )}
          >
            {deadlinePast ? (bn ? "অতীত" : "Past") : bn ? "আসন্ন" : "Upcoming"}
          </Badge>
        </p>
      ) : null}

      {/* Per-campaign donation stats */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl bg-muted/50 px-3.5 py-2.5 text-[12px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck aria-hidden className="h-3.5 w-3.5 text-primary" />
          {bn ? "সম্পন্ন অনুদান" : "Completed"}:{" "}
          <span className="font-semibold text-foreground">
            {toBnDigits(campaign.stats.completedCount)} {bn ? "টি" : ""}
          </span>
          {campaign.stats.completedSum > 0 ? (
            <span className="font-semibold text-primary dark:text-gold">{formatTaka(campaign.stats.completedSum, lang)}</span>
          ) : null}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Receipt aria-hidden className="h-3.5 w-3.5 text-gold" />
          {bn ? "মোট রসিদ" : "Total receipts"}:{" "}
          <span className="font-semibold text-foreground">
            {toBnDigits(campaign.stats.totalCount)} {bn ? "টি" : ""}
          </span>
        </span>
      </div>

      {/* Active toggle + edit */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-2.5">
          <Switch
            id={`campaign-active-${campaign.id}`}
            checked={campaign.active}
            disabled={busy}
            onCheckedChange={(checked) => onToggle(campaign, checked)}
            aria-label={bn ? "ক্যাম্পেইন সক্রিয়/নিষ্ক্রিয় করুন" : "Toggle campaign active"}
          />
          <Label
            htmlFor={`campaign-active-${campaign.id}`}
            className={cn("text-[12.5px] font-semibold", campaign.active ? "text-primary dark:text-gold" : "text-muted-foreground")}
          >
            {campaign.active ? (bn ? "সক্রিয়" : "Active") : bn ? "নিষ্ক্রিয়" : "Inactive"}
          </Label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(campaign)}
            disabled={busy}
            className="min-h-9 gap-1.5 text-[12.5px] font-bold"
          >
            <Pencil aria-hidden className="h-3.5 w-3.5" />
            {bn ? "সম্পাদনা" : "Edit"}
          </Button>
          <CampaignDeleteButton
            campaign={campaign}
            lang={lang}
            disabled={busy}
            onRemoved={() => onRemove(campaign)}
          />
        </div>
      </div>
    </article>
  );
}

/** Campaign management board: summary cards + editable campaign cards. */
export function CampaignBoard({ campaigns, lang }: CampaignBoardProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editFor, setEditFor] = useState<AdminCampaignData | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  /** Optimistic patches — survive Router Cache staleness after mutations. */
  const [patches, setPatches] = useState<Map<string, CampaignPatch>>(() => new Map());
  /** Rows removed optimistically after a confirmed delete. */
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  /** Rows created this session, prepended until the server refresh lands. */
  const [createdRows, setCreatedRows] = useState<AdminCampaignData[]>([]);

  const effective = useMemo(() => {
    const createdIds = new Set(createdRows.map((row) => row.id));
    const base = [
      ...createdRows,
      ...campaigns.filter((campaign) => !createdIds.has(campaign.id) && !removedIds.has(campaign.id)),
    ];
    if (patches.size === 0) return base;
    return base.map((campaign) => {
      const patch = patches.get(campaign.id);
      return patch ? { ...campaign, ...patch } : campaign;
    });
  }, [campaigns, createdRows, patches, removedIds]);

  const totals = useMemo(
    () => ({
      count: effective.length,
      active: effective.filter((campaign) => campaign.active).length,
      targetSum: effective.reduce((sum, campaign) => sum + campaign.targetAmount, 0),
      raisedSum: effective.reduce((sum, campaign) => sum + campaign.raisedAmount, 0),
    }),
    [effective],
  );

  async function patchCampaign(
    id: string,
    payload: CampaignEditPatch | { active: boolean },
    patch: CampaignPatch,
  ): Promise<boolean> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { data?: { message?: string }; error?: string } = await res.json();
      if (!res.ok) {
        toast({ title: result.error ?? (bn ? "হালনাগাদ করা যায়নি" : "Update failed"), variant: "destructive" });
        return false;
      }
      setPatches((prev) => {
        const next = new Map(prev);
        const merged = { ...(next.get(id) ?? {}), ...patch };
        next.set(id, merged);
        return next;
      });
      router.refresh();
      return true;
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error", variant: "destructive" });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function onToggle(campaign: AdminCampaignData, active: boolean): Promise<void> {
    if (busyId) return;
    const ok = await patchCampaign(campaign.id, { active }, { active });
    if (ok) {
      toast({
        title: active
          ? bn ? "ক্যাম্পেইন সক্রিয় করা হয়েছে" : "Campaign activated"
          : bn ? "ক্যাম্পেইন নিষ্ক্রিয় করা হয়েছে" : "Campaign deactivated",
        description: bn ? campaign.titleBn : campaign.titleEn,
      });
    }
  }

  async function onEditSaved(patch: CampaignEditPatch): Promise<void> {
    if (!editFor) return;
    await patchCampaign(editFor.id, patch, patch);
  }

  function onCreated(campaign: AdminCampaignData): void {
    setCreatedRows((prev) => [campaign, ...prev]);
    router.refresh();
  }

  function onRemoved(campaign: AdminCampaignData): void {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(campaign.id);
      return next;
    });
    setCreatedRows((prev) => prev.filter((row) => row.id !== campaign.id));
  }

  const summaryCards = [
    { icon: Target, value: toBnDigits(totals.count), label: bn ? "মোট ক্যাম্পেইন" : "Total campaigns", tone: "primary" },
    { icon: BadgeCheck, value: toBnDigits(totals.active), label: bn ? "সক্রিয়" : "Active", tone: "primary" },
    { icon: Flag, value: formatTaka(totals.targetSum, lang), label: bn ? "সম্মিলিত লক্ষ্য" : "Combined target", tone: "primary" },
    { icon: HandHeart, value: formatTaka(totals.raisedSum, lang), label: bn ? "সম্মিলিত সংগৃহীত" : "Combined raised", tone: "gold" },
  ] as const;

  return (
    <section aria-label={bn ? "ক্যাম্পেইন ব্যবস্থাপনা" : "Campaign management"} className="space-y-4">
      {/* Board toolbar — create action */}
      <div className="flex justify-end">
        <CampaignComposerButton lang={lang} onClick={() => setComposerOpen(true)} disabled={composerOpen} />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    card.tone === "gold" ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-[12.5px] font-semibold text-muted-foreground">{card.label}</p>
              </div>
              <p
                className={cn(
                  "font-heading mt-3 text-2xl font-bold leading-none",
                  card.tone === "gold" ? "text-primary dark:text-gold" : undefined,
                )}
              >
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Campaign cards */}
      {effective.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Target className="h-6 w-6" />
          </span>
          <p className="mt-4 text-[15px] font-semibold">
            {bn ? "এখনো কোনো ক্যাম্পেইন নেই" : "No campaigns yet"}
          </p>
          <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
            {bn
              ? "“সহযোগিতা” পৃষ্ঠায় প্রদর্শিত ফান্ডরাইজিং ক্যাম্পেইনগুলো এখানে ব্যবস্থাপনা করা হবে।"
              : "Fundraising campaigns shown on the support page are managed here."}
          </p>
          <Link
            href="/support"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[13px] font-bold text-gold-foreground transition-opacity hover:opacity-90"
          >
            <HandHeart aria-hidden className="h-4 w-4" />
            {bn ? "অনুদান পৃষ্ঠা দেখুন" : "View the support page"}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {effective.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              lang={lang}
              busy={busyId !== null}
              onToggle={(target, active) => void onToggle(target, active)}
              onEdit={(target) => setEditFor(target)}
              onRemove={onRemoved}
            />
          ))}
        </div>
      )}

      {/* Edit dialog (mounted fresh per open → state initialises from current values) */}
      {editFor ? (
        <CampaignEditDialog
          key={editFor.id}
          campaign={editFor}
          lang={lang}
          onOpenChange={(open) => {
            if (!open) setEditFor(null);
          }}
          onSaved={(patch) => void onEditSaved(patch)}
        />
      ) : null}

      {/* Create dialog (fresh state per open) */}
      {composerOpen ? (
        <CampaignComposerDialog
          lang={lang}
          onOpenChange={(open) => {
            if (!open) setComposerOpen(false);
          }}
          onCreated={onCreated}
        />
      ) : null}
    </section>
  );
}
