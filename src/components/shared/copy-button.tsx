"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Lang } from "@/lib/locale";

interface CopyButtonProps {
  value: string;
  label: string;
  lang: Lang;
}

/** Inline copy affordance used beside codes/numbers (receipt, lookup pages). */
export function CopyButton({ value, label, lang }: CopyButtonProps) {
  const bn = lang === "bn";
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({ title: bn ? "কপি হয়েছে" : "Copied" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: bn ? "কপি করা যায়নি" : "Could not copy", variant: "destructive" });
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`${bn ? "কপি করুন" : "Copy"} ${label}`}
    >
      {copied ? (
        <Check aria-hidden className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">{bn ? "কপি করুন" : "Copy"}</span>
    </button>
  );
}
