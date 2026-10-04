"use client";

import { useState } from "react";
import { BadgeCheck, CircleDashed, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { cn } from "@/lib/utils";
import type { Language } from "@/types";
import type { DonationStatus } from "@/components/admin/donation-ledger";

interface DonationStatusCellProps {
  receiptNo: string;
  status: DonationStatus;
  lang: Language;
  /** True while this row's transition request is in flight. */
  pending: boolean;
  /** True while any row is mutating (prevents concurrent transitions). */
  disabled: boolean;
  /** Donor · date label shown on mobile inside the collapsible. */
  mobileLabel: string;
  onComplete: () => void;
  onReopen: () => void;
}

/**
 * Status cell for the donation ledger: expandable status pill (kept from the
 * original design) plus an initiated→completed / completed→initiated action.
 */
export function DonationStatusCell({
  receiptNo,
  status,
  lang,
  pending,
  disabled,
  mobileLabel,
  onComplete,
  onReopen,
}: DonationStatusCellProps) {
  const bn = lang === "bn";
  const [confirmReopen, setConfirmReopen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2 lg:flex-row lg:items-center lg:justify-end lg:gap-3">
      <Collapsible>
        <CollapsibleTrigger className="group inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[11.5px] font-bold transition-colors">
          {status === "completed" ? (
            <span className="inline-flex items-center gap-1.5 border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-500/20">
              <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
              {bn ? "সম্পন্ন" : "Completed"}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 border-gold/40 bg-gold/10 text-gold group-hover:bg-gold/20">
              <CircleDashed aria-hidden className="h-3.5 w-3.5" />
              {bn ? "অপেক্ষমাণ" : "Initiated"}
            </span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="lg:hidden">
          {/* Mobile-only extra info when the table columns are hidden */}
          <p className="mt-2 text-left text-[11.5px] text-muted-foreground">{mobileLabel}</p>
        </CollapsibleContent>
      </Collapsible>

      {status === "initiated" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onComplete}
          disabled={disabled}
          aria-label={bn ? `রসিদ ${receiptNo} সম্পন্ন করুন` : `Mark receipt ${receiptNo} completed`}
          className={cn(
            "min-h-9 gap-1.5 border-emerald-600/40 bg-emerald-500/10 text-[11.5px] font-bold text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400",
            disabled && !pending && "opacity-60",
          )}
        >
          {pending ? (
            <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BadgeCheck aria-hidden className="h-3.5 w-3.5" />
          )}
          {bn ? "সম্পন্ন করুন" : "Complete"}
        </Button>
      ) : (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmReopen(true)}
            disabled={disabled}
            aria-label={bn ? `রসিদ ${receiptNo} পুনরায় খুলুন` : `Reopen receipt ${receiptNo}`}
            className="min-h-9 gap-1.5 px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
          >
            {pending ? (
              <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
            )}
            {bn ? "পুনরায় খুলুন" : "Reopen"}
          </Button>

          <AlertDialog open={confirmReopen} onOpenChange={setConfirmReopen}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-lg">
                  {bn ? "অনুদান পুনরায় খুলুন?" : "Reopen this donation?"}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-[13px] leading-relaxed">
                  {bn
                    ? `রসিদ ${receiptNo} আবার “অপেক্ষমাণ” অবস্থায় ফিরে যাবে — সম্পন্ন অনুদানের যোগফল থেকে বাদ পড়বে।`
                    : `Receipt ${receiptNo} will return to the initiated state and drop out of completed totals.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="min-h-11">{bn ? "বাতিল" : "Cancel"}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setConfirmReopen(false);
                    onReopen();
                  }}
                  className="min-h-11 gap-1.5 bg-gold-gradient font-bold text-gold-foreground hover:opacity-90"
                >
                  <RotateCcw aria-hidden className="h-4 w-4" />
                  {bn ? "পুনরায় খুলুন" : "Reopen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
