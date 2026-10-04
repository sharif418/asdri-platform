"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { AdminCampaignData } from "@/components/admin/admin-types";
import type { Language } from "@/types";

/** Fields the dialog can patch (mirrors campaignUpdateSchema server-side). */
export interface CampaignEditPatch {
  targetAmount?: number;
  raisedAmount?: number;
  deadline?: string | null;
}

interface CampaignEditDialogProps {
  campaign: AdminCampaignData;
  lang: Language;
  onOpenChange: (open: boolean) => void;
  onSaved: (patch: CampaignEditPatch) => void;
}

/** yyyy-mm-dd slice for the native date input (empty string = no deadline). */
function dateInputValue(deadline: string | null): string {
  return deadline ? deadline.slice(0, 10) : "";
}

/** Edit dialog for campaign target/raised amounts and deadline. */
export function CampaignEditDialog({ campaign, lang, onOpenChange, onSaved }: CampaignEditDialogProps) {
  const bn = lang === "bn";
  const [target, setTarget] = useState(String(campaign.targetAmount));
  const [raised, setRaised] = useState(String(campaign.raisedAmount));
  const [deadline, setDeadline] = useState(dateInputValue(campaign.deadline));
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(): Promise<void> {
    if (submitting) return;
    setFieldError(null);

    const targetValue = target.trim();
    const raisedValue = raised.trim();
    const deadlineValue = deadline.trim();

    const targetNum = targetValue === "" ? null : Number(targetValue);
    const raisedNum = raisedValue === "" ? null : Number(raisedValue);

    if (targetNum !== null && (!Number.isFinite(targetNum) || targetNum < 1 || targetNum > 1e9)) {
      setFieldError(bn ? "লক্ষ্য পরিমাণ ১ থেকে ১০০ কোটির মধ্যে দিন" : "Target must be between 1 and 1e9");
      return;
    }
    if (raisedNum !== null && (!Number.isFinite(raisedNum) || raisedNum < 0 || raisedNum > 1e9)) {
      setFieldError(bn ? "সংগৃহীত পরিমাণ ০ থেকে ১০০ কোটির মধ্যে দিন" : "Raised must be between 0 and 1e9");
      return;
    }

    // Build a payload of only the changed fields (deadline compared by yyyy-mm-dd).
    const payload: { targetAmount?: number; raisedAmount?: number; deadline?: string | null } = {};
    if (targetNum !== null && targetNum !== campaign.targetAmount) payload.targetAmount = targetNum;
    if (raisedNum !== null && raisedNum !== campaign.raisedAmount) payload.raisedAmount = raisedNum;
    const originalDate = dateInputValue(campaign.deadline);
    if (deadlineValue !== originalDate) {
      payload.deadline = deadlineValue === "" ? null : new Date(`${deadlineValue}T00:00:00`).toISOString();
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: bn ? "কোনো পরিবর্তন করা হয়নি" : "No changes to save" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: { data?: { message?: string }; error?: string; fields?: Record<string, string> } = await res.json();

      if (!res.ok) {
        if (result.fields?.targetAmount) setFieldError(result.fields.targetAmount);
        else if (result.fields?.raisedAmount) setFieldError(result.fields.raisedAmount);
        else if (result.fields?.deadline) setFieldError(result.fields.deadline);
        toast({ title: result.error ?? (bn ? "সমস্যা হয়েছে" : "Something went wrong"), variant: "destructive" });
        return;
      }

      toast({ title: result.data?.message ?? (bn ? "ক্যাম্পেইন হালনাগাদ হয়েছে" : "Campaign updated") });
      onSaved(payload);
      onOpenChange(false);
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error — try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg leading-snug">
            {bn ? "ক্যাম্পেইন সম্পাদনা" : "Edit Campaign"}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            {bn ? campaign.titleBn : campaign.titleEn}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`campaign-target-${campaign.id}`}>
                {bn ? "লক্ষ্য পরিমাণ (৳)" : "Target amount (৳)"}
              </Label>
              <Input
                id={`campaign-target-${campaign.id}`}
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                dir="ltr"
                aria-invalid={Boolean(fieldError)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`campaign-raised-${campaign.id}`}>
                {bn ? "সংগৃহীত পরিমাণ (৳)" : "Raised amount (৳)"}
              </Label>
              <Input
                id={`campaign-raised-${campaign.id}`}
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={raised}
                onChange={(event) => setRaised(event.target.value)}
                dir="ltr"
                aria-invalid={Boolean(fieldError)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`campaign-deadline-${campaign.id}`}>
              {bn ? "সময়সীমা (ঐচ্ছিক)" : "Deadline (optional)"}
            </Label>
            <Input
              id={`campaign-deadline-${campaign.id}`}
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              dir="ltr"
            />
            <p className="text-[11.5px] text-muted-foreground">
              {bn ? "খালি রাখলে সময়সীমা বাতিল হবে।" : "Leave empty to remove the deadline."}
            </p>
          </div>

          {fieldError ? (
            <p role="alert" className="text-[12px] font-medium text-destructive">
              {fieldError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="min-h-11">
            {bn ? "বাতিল" : "Cancel"}
          </Button>
          <Button
            onClick={() => void onSubmit()}
            disabled={submitting}
            className="min-h-11 gap-2 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90"
          >
            {submitting ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                {bn ? "সংরক্ষণ হচ্ছে…" : "Saving…"}
              </>
            ) : (
              <>
                <Save aria-hidden className="h-4 w-4" />
                {bn ? "সংরক্ষণ করুন" : "Save Changes"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
