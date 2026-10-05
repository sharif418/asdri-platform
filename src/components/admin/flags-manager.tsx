"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface FlagRow {
  key: string;
  labelBn: string;
  labelEn: string;
  description: string | null;
  isEnabled: boolean;
  updatedAt: string | Date;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Flag list with instant toggles (optimistic UI, PATCH /api/admin/flags). */
export function FlagsManager({ flags }: { flags: FlagRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(flags);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function toggle(row: FlagRow, isEnabled: boolean) {
    setBusyKey(row.key);
    setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, isEnabled } : r)));
    try {
      const res = await fetch("/api/admin/flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ updates: [{ key: row.key, isEnabled }] }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, isEnabled: !isEnabled } : r)));
        toast({ title: json.error ?? "পরিবর্তন করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: `${row.labelBn} ${isEnabled ? "চালু" : "বন্ধ"} করা হয়েছে` });
      router.refresh();
    } catch {
      setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, isEnabled: !isEnabled } : r)));
      toast({ title: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <ul className="divide-y rounded-2xl border bg-card shadow-sm">
      {rows.map((row) => (
        <li key={row.key} className="flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14px] font-semibold">{row.labelBn}</p>
              <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10.5px] text-muted-foreground" dir="ltr">
                {row.key}
              </code>
            </div>
            {row.description ? <p className="mt-0.5 text-[12.5px] text-muted-foreground">{row.description}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {busyKey === row.key ? <Loader2 aria-hidden className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                row.isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}
            >
              {row.isEnabled ? "চালু" : "বন্ধ"}
            </span>
            <Switch
              checked={row.isEnabled}
              onCheckedChange={(checked) => void toggle(row, checked)}
              aria-label={`${row.labelBn} ${row.isEnabled ? "বন্ধ" : "চালু"} করুন`}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
