"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintButtonProps {
  /** Body class toggled during printing — selects the site's print stylesheet. */
  bodyClass: "printing-notice" | "printing-fatwa" | "printing-receipt" | "printing-exam-letter";
  label: string;
  /** Variant/size tweaks per surface (defaults match the notice pad). */
  className?: string;
  variant?: "default" | "outline";
}

/**
 * Shared "official copy" print trigger — toggles the print body-class,
 * calls window.print(), then always removes the class (afterprint fires in
 * most engines; the timeout is the safety net for the ones that don't).
 */
export function PrintButton({ bodyClass, label, className, variant = "default" }: PrintButtonProps) {
  useEffect(
    () => () => {
      // Defensive: never leave the class on the body after unmount.
      document.body.classList.remove(bodyClass);
    },
    [bodyClass],
  );

  function print() {
    document.body.classList.add(bodyClass);
    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    // Fallback cleanup for browsers that never fire afterprint.
    window.setTimeout(cleanup, 1500);
  }

  return (
    <Button
      type="button"
      onClick={print}
      variant={variant}
      className={
        className ??
        "gap-2 bg-primary font-semibold text-primary-foreground hover:bg-primary/90 print:hidden"
      }
    >
      <Printer aria-hidden className="h-4 w-4" />
      {label}
    </Button>
  );
}
