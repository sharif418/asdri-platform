"use client";

import { useCallback, useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

/**
 * The admin's replacement for window.confirm() (round 3): renders the
 * designed ConfirmDialog and returns an awaitable boolean.
 *
 *   const confirm = useConfirm();
 *   …
 *   if (!(await confirm({ title: "মুছে ফেলবেন?", description: "…" }))) return;
 *   await deleteThing();
 *
 * The hook must be called once per component; the dialog element is placed
 * by <ConfirmProvider> (or render the returned element). This file keeps the
 * minimal local variant: render {confirmDialog} anywhere in the component.
 */
export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function useConfirm(): {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  confirmDialog: ReactNode;
} {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setOptions(next);
        setResolver(() => resolve);
      }),
    [],
  );

  const settle = (value: boolean) => {
    resolver?.(value);
    setResolver(null);
    setOptions(null);
  };

  const confirmDialog = (
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

  return { confirm, confirmDialog };
}
