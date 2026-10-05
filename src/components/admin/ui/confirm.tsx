"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

/**
 * Imperative destructive-action confirmation for the admin (round 3):
 * replaces every native window.confirm() with the designed dialog.
 *
 *   import { adminConfirm } from "@/components/admin/ui/confirm";
 *   if (!(await adminConfirm({ title: "মুছে ফেলবেন?" }))) return;
 *
 * <ConfirmBridge /> (mounted once in the admin layout) renders the dialog.
 */

export interface AdminConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type Listener = (options: AdminConfirmOptions | null) => void;

let listener: Listener | null = null;

/** Show the confirmation dialog; resolves when the user decides. */
export function adminConfirm(options: AdminConfirmOptions): Promise<boolean> {
  if (!listener) {
    // No bridge mounted (e.g. a stray call outside the admin tree): fall back
    // to never blocking — resolve false rather than hanging forever.
    return Promise.resolve(false);
  }
  return new Promise((resolve) => {
    listenerWithOptions(options, (value: boolean) => resolve(value));
  });
}

/** Internal: the bridge registers itself and receives (options, settle). */
function listenerWithOptions(options: AdminConfirmOptions, settle: (value: boolean) => void): void {
  listener?.(options);
  pendingSettle = settle;
}

let pendingSettle: ((value: boolean) => void) | null = null;

/** Mounted once by the admin layout: owns the single dialog instance. */
export function ConfirmBridge() {
  const [options, setOptions] = useState<AdminConfirmOptions | null>(null);

  useEffect(() => {
    listener = (next) => setOptions(next);
    return () => {
      listener = null;
    };
  }, []);

  const settle = (value: boolean) => {
    pendingSettle?.(value);
    pendingSettle = null;
    setOptions(null);
  };

  return (
    <ConfirmDialog
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      title={options?.title ?? ""}
      description={options?.description}
      confirmLabel={options?.confirmLabel}
      cancelLabel={options?.cancelLabel}
      onConfirm={() => settle(true)}
    />
  );
}
