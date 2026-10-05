"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatNumber } from "@/lib/format";

/**
 * CSV export button for the finance module (donations / manual ledger).
 * Both export endpoints sit behind requireModule (session + CSRF header even
 * on GET), so the file is fetched with the header and handed to the browser
 * as a blob download — the applications-export-button pattern.
 */
export function FinanceExportButton({
  endpoint,
  fallbackName,
  filters,
  label = "CSV এক্সপোর্ট",
}: {
  endpoint: string;
  fallbackName: string;
  filters: Record<string, string | undefined>;
  label?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [rows, setRows] = useState<number | null>(null);

  async function onExport() {
    if (downloading) return;
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value) params.set(key, value);
      }
      const query = params.size > 0 ? `?${params.toString()}` : "";
      const res = await fetch(`${endpoint}${query}`, {
        headers: { "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "" },
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({ title: json?.error ?? "এক্সপোর্ট করা যায়নি", variant: "destructive" });
        return;
      }
      const text = await res.text();
      const disposition = res.headers.get("content-disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `${fallbackName}-${new Date().toISOString().slice(0, 10)}.csv`;

      const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      const dataRows = Math.max(0, text.split("\r\n").length - 1);
      setRows(dataRows);
      toast({ title: "CSV ডাউনলোড শুরু হয়েছে", description: `${formatNumber(dataRows, "bn")} টি সারি · ফাইল: ${filename}` });
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onExport}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {downloading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Download aria-hidden className="h-4 w-4" />}
        {label}
      </button>
      {rows !== null && (
        <span className="text-[11px] text-muted-foreground" role="status">
          সর্বশেষ এক্সপোর্ট: {formatNumber(rows, "bn")} সারি
        </span>
      )}
    </div>
  );
}
