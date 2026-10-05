"use client";

import { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
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

/**
 * The admin's destructive-action confirmation (round 3): replaces every
 * native window.confirm() with the designed AlertDialog — focus is trapped,
 * Escape/ Cancel is safe, the destructive action is a distinct red button.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "নিশ্চিত করুন",
  cancelLabel = "বাতিল",
  onConfirm,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  children?: ReactNode;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-start gap-2.5 pr-6">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle aria-hidden className="h-4.5 w-4.5 text-destructive" />
            </span>
            <span className="font-heading">{title}</span>
          </AlertDialogTitle>
          {description ? (
            <AlertDialogDescription className="text-[13px] leading-relaxed">{description}</AlertDialogDescription>
          ) : null}
          {children}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault(); // keep the dialog open while the action runs
              onConfirm();
            }}
            className={cn(
              "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive",
            )}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
