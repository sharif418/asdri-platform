"use client";

import { useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface CampaignComposerDialogProps {
  lang: Language;
  onOpenChange: (open: boolean) => void;
  /** Called with the optimistic row after the server confirms the create. */
  onCreated: (campaign: AdminCampaignData) => void;
}

interface ComposerValues {
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  target: string;
  deadline: string;
}

function emptyValues(): ComposerValues {
  return { titleBn: "", titleEn: "", descriptionBn: "", descriptionEn: "", target: "", deadline: "" };
}

/** Client-side validation mirroring campaignCreateSchema (Bengali messages). */
function validateComposer(values: ComposerValues, bn: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  const titleBn = values.titleBn.trim();
  if (titleBn.length < 1) errors.titleBn = bn ? "বাংলা শিরোনাম লিখুন" : "Bengali title is required";
  else if (titleBn.length > 120) errors.titleBn = bn ? "বাংলা শিরোনাম ১২০ অক্ষরের বেশি হতে পারবে না" : "Max 120 characters";

  const titleEn = values.titleEn.trim();
  if (titleEn.length < 1) errors.titleEn = bn ? "ইংরেজি শিরোনাম লিখুন" : "English title is required";
  else if (titleEn.length > 120) errors.titleEn = bn ? "ইংরেজি শিরোনাম ১২০ অক্ষরের বেশি হতে পারবে না" : "Max 120 characters";

  const descriptionBn = values.descriptionBn.trim();
  if (descriptionBn.length < 1) errors.descriptionBn = bn ? "বাংলা বিবরণ লিখুন" : "Bengali description is required";
  else if (descriptionBn.length > 2000) errors.descriptionBn = bn ? "বাংলা বিবরণ ২০০০ অক্ষরের বেশি হতে পারবে না" : "Max 2000 characters";

  const descriptionEn = values.descriptionEn.trim();
  if (descriptionEn.length < 1) errors.descriptionEn = bn ? "ইংরেজি বিবরণ লিখুন" : "English description is required";
  else if (descriptionEn.length > 2000) errors.descriptionEn = bn ? "ইংরেজি বিবরণ ২০০০ অক্ষরের বেশি হতে পারবে না" : "Max 2000 characters";

  const targetNum = values.target.trim() === "" ? null : Number(values.target.trim());
  if (targetNum === null || !Number.isFinite(targetNum) || targetNum < 1 || targetNum > 1e9) {
    errors.target = bn ? "লক্ষ্য পরিমাণ ১ থেকে ১০০ কোটির মধ্যে দিন" : "Target must be between 1 and 1e9";
  }

  if (values.deadline.trim() !== "") {
    const parsed = new Date(`${values.deadline.trim()}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) errors.deadline = bn ? "সঠিক তারিখ দিন" : "Enter a valid date";
  }
  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-[12px] font-medium text-destructive">
      {message}
    </p>
  );
}

/** Create dialog for a new fundraising campaign (bilingual, target, deadline). */
export function CampaignComposerDialog({ lang, onOpenChange, onCreated }: CampaignComposerDialogProps) {
  const bn = lang === "bn";
  const [values, setValues] = useState<ComposerValues>(emptyValues());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ComposerValues>(key: K, next: ComposerValues[K]): void {
    setValues((prev) => ({ ...prev, [key]: next }));
  }

  async function onSubmit(): Promise<void> {
    if (submitting) return;

    const errors = validateComposer(values, bn);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ title: bn ? "ফর্মের তথ্যগুলো যাচাই করুন" : "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const deadlineValue = values.deadline.trim();
      const payload: Record<string, unknown> = {
        titleBn: values.titleBn.trim(),
        titleEn: values.titleEn.trim(),
        descriptionBn: values.descriptionBn.trim(),
        descriptionEn: values.descriptionEn.trim(),
        targetAmount: Number(values.target.trim()),
      };
      if (deadlineValue !== "") payload.deadline = new Date(`${deadlineValue}T00:00:00`).toISOString();

      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: {
        data?: {
          id?: string;
          slug?: string;
          titleBn?: string;
          titleEn?: string;
          descriptionBn?: string;
          descriptionEn?: string;
          targetAmount?: number;
          deadline?: string | null;
          createdAt?: string;
          message?: string;
        };
        error?: string;
        fields?: Record<string, string>;
      } = await res.json();

      if (!res.ok) {
        if (result.fields) setFieldErrors(result.fields);
        toast({ title: result.error ?? (bn ? "সমস্যা হয়েছে" : "Something went wrong"), variant: "destructive" });
        return;
      }

      const data = result.data;
      if (!data?.id || !data.slug) {
        toast({ title: bn ? "সমস্যা হয়েছে" : "Something went wrong", variant: "destructive" });
        return;
      }

      toast({
        title: data.message ?? (bn ? "ক্যাম্পেইন তৈরি হয়েছে" : "Campaign created"),
        description: data.slug,
      });

      // Optimistic row for the board (zeroed stats — aggregates refresh server-side).
      onCreated({
        id: data.id,
        slug: data.slug,
        titleBn: data.titleBn ?? values.titleBn.trim(),
        titleEn: data.titleEn ?? values.titleEn.trim(),
        descriptionBn: data.descriptionBn ?? values.descriptionBn.trim(),
        descriptionEn: data.descriptionEn ?? values.descriptionEn.trim(),
        targetAmount: data.targetAmount ?? Number(values.target.trim()),
        raisedAmount: 0,
        currency: "BDT",
        deadline: data.deadline ?? null,
        active: true,
        createdAt: data.createdAt ?? new Date().toISOString(),
        stats: { completedCount: 0, completedSum: 0, totalCount: 0 },
      });
      onOpenChange(false);
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error — try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg leading-snug">
            {bn ? "নতুন ক্যাম্পেইন" : "New Campaign"}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            {bn
              ? "শিরোনাম, বিবরণ, লক্ষ্য ও সময়সীমা দিয়ে ফান্ডরাইজিং ক্যাম্পেইন তৈরি করুন — “সহযোগিতা” পৃষ্ঠায় সঙ্গে সঙ্গে দেখা যাবে।"
              : "Create a fundraising campaign with title, description, target, and deadline — it appears on the support page immediately."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title pair */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-new-title-bn" className="gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary dark:text-gold">
                  বাংলা
                </span>
                {bn ? "শিরোনাম *" : "Title (Bengali) *"}
              </Label>
              <Input
                id="campaign-new-title-bn"
                value={values.titleBn}
                onChange={(event) => update("titleBn", event.target.value)}
                maxLength={120}
                aria-invalid={Boolean(fieldErrors.titleBn)}
                aria-describedby={fieldErrors.titleBn ? "campaign-new-title-bn-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="campaign-new-title-bn-error" message={fieldErrors.titleBn} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-new-title-en" className="gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  English
                </span>
                {bn ? "শিরোনাম (ইংরেজি) *" : "Title (English) *"}
              </Label>
              <Input
                id="campaign-new-title-en"
                dir="ltr"
                value={values.titleEn}
                onChange={(event) => update("titleEn", event.target.value)}
                maxLength={120}
                aria-invalid={Boolean(fieldErrors.titleEn)}
                aria-describedby={fieldErrors.titleEn ? "campaign-new-title-en-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="campaign-new-title-en-error" message={fieldErrors.titleEn} />
              <p className="text-[11.5px] leading-snug text-muted-foreground">
                {bn ? "স্লাগ এই শিরোনাম থেকে তৈরি হবে।" : "The URL slug is generated from this title."}
              </p>
            </div>
          </div>

          {/* Description pair */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-new-desc-bn">
                {bn ? "বিবরণ (বাংলা) *" : "Description (Bengali) *"}
              </Label>
              <Textarea
                id="campaign-new-desc-bn"
                value={values.descriptionBn}
                onChange={(event) => update("descriptionBn", event.target.value)}
                maxLength={2000}
                rows={4}
                aria-invalid={Boolean(fieldErrors.descriptionBn)}
                aria-describedby={fieldErrors.descriptionBn ? "campaign-new-desc-bn-error" : undefined}
              />
              <FieldError id="campaign-new-desc-bn-error" message={fieldErrors.descriptionBn} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-new-desc-en">
                {bn ? "বিবরণ (ইংরেজি) *" : "Description (English) *"}
              </Label>
              <Textarea
                id="campaign-new-desc-en"
                dir="ltr"
                value={values.descriptionEn}
                onChange={(event) => update("descriptionEn", event.target.value)}
                maxLength={2000}
                rows={4}
                aria-invalid={Boolean(fieldErrors.descriptionEn)}
                aria-describedby={fieldErrors.descriptionEn ? "campaign-new-desc-en-error" : undefined}
              />
              <FieldError id="campaign-new-desc-en-error" message={fieldErrors.descriptionEn} />
            </div>
          </div>

          {/* Target + deadline */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-new-target">{bn ? "লক্ষ্য পরিমাণ (৳) *" : "Target amount (৳) *"}</Label>
              <Input
                id="campaign-new-target"
                type="number"
                inputMode="decimal"
                min={1}
                step="any"
                value={values.target}
                onChange={(event) => update("target", event.target.value)}
                dir="ltr"
                aria-invalid={Boolean(fieldErrors.target)}
                aria-describedby={fieldErrors.target ? "campaign-new-target-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="campaign-new-target-error" message={fieldErrors.target} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="campaign-new-deadline">{bn ? "সময়সীমা (ঐচ্ছিক)" : "Deadline (optional)"}</Label>
              <Input
                id="campaign-new-deadline"
                type="date"
                value={values.deadline}
                onChange={(event) => update("deadline", event.target.value)}
                dir="ltr"
                aria-invalid={Boolean(fieldErrors.deadline)}
                aria-describedby={fieldErrors.deadline ? "campaign-new-deadline-error" : undefined}
                className="min-h-11"
              />
              <FieldError id="campaign-new-deadline-error" message={fieldErrors.deadline} />
            </div>
          </div>
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
                {bn ? "তৈরি হচ্ছে…" : "Creating…"}
              </>
            ) : (
              <>
                <Save aria-hidden className="h-4 w-4" />
                {bn ? "ক্যাম্পেইন তৈরি করুন" : "Create Campaign"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Gold-gradient "নতুন ক্যাম্পেইন" trigger button for the board header. */
export function CampaignComposerButton({
  lang,
  onClick,
  disabled,
}: {
  lang: Language;
  onClick: () => void;
  disabled: boolean;
}) {
  const bn = lang === "bn";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gold-gradient px-5 text-[13px] font-bold text-gold-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      <Plus aria-hidden className="h-4 w-4" />
      {bn ? "নতুন ক্যাম্পেইন" : "New Campaign"}
    </button>
  );
}
