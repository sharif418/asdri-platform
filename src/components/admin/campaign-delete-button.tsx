"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import type { AdminCampaignData } from "@/components/admin/admin-types";
import type { Language } from "@/types";

interface CampaignDeleteButtonProps {
  campaign: AdminCampaignData;
  lang: Language;
  /** True while another board mutation is in flight (prevents concurrency). */
  disabled: boolean;
  /** Called after the server confirms the deletion (board drops the card). */
  onRemoved: () => void;
}

/**
 * Per-card delete action: a subtle trash button that turns red on hover,
 * guarded by an AlertDialog that names the campaign (Bengali-first).
 * Campaigns with donation-intent history get a destructive 409 toast.
 */
export function CampaignDeleteButton({ campaign, lang, disabled, onRemoved }: CampaignDeleteButtonProps) {
  const bn = lang === "bn";
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function onDelete(): Promise<void> {
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: "DELETE" });
      const result: { data?: { message?: string }; error?: string } = await res.json();

      if (!res.ok) {
        // 409 (donation history) and friends surface the server's Bengali message.
        toast({
          title: result.error ?? (bn ? "মুছে ফেলা যায়নি" : "Delete failed"),
          description: res.status === 409 ? (bn ? campaign.titleBn : campaign.titleEn) : undefined,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: result.data?.message ?? (bn ? "ক্যাম্পেইন মুছে ফেলা হয়েছে" : "Campaign deleted"),
        description: bn ? campaign.titleBn : campaign.titleEn,
      });
      onRemoved();
      router.refresh();
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা হয়েছে" : "Network error — try again", variant: "destructive" });
    } finally {
      setPending(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled}
        aria-label={bn ? `ক্যাম্পেইন মুছে ফেলুন: ${campaign.titleBn}` : `Delete campaign ${campaign.titleEn}`}
        className="min-h-9 gap-1.5 border-transparent bg-transparent text-[12.5px] font-semibold text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
      >
        {pending ? (
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 aria-hidden className="h-3.5 w-3.5" />
        )}
        {bn ? "মুছুন" : "Delete"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-lg">
              {bn ? "ক্যাম্পেইন মুছে ফেলবেন?" : "Delete this campaign?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] leading-relaxed">
              {bn
                ? `“${campaign.titleBn}” স্থায়ীভাবে মুছে যাবে। এতে অনুদান রেকর্ড থাকলে আর্থিক নথির অখণ্ডতার জন্য মুছে ফেলা যাবে না।`
                : `"${campaign.titleEn}" will be removed permanently. Campaigns with donation records cannot be deleted (financial-record integrity).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="min-h-11">{bn ? "বাতিল" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void onDelete()}
              disabled={pending}
              className="min-h-11 gap-1.5 bg-destructive font-bold text-white hover:bg-destructive/90"
            >
              {pending ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden className="h-4 w-4" />
              )}
              {bn ? "মুছে ফেলুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
