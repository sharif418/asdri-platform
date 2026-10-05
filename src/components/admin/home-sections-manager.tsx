"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";

interface HomeSectionRow {
  key: string;
  titleBn: string;
  titleEn: string;
  isEnabled: boolean;
  sortOrder: number;
}

const SECTION_HINTS: Record<string, string> = {
  hero: "শীর্ষ পরিচিতি ব্যানার (ছবি নিচের হিরো ইমেজ অংশ থেকে বদলান)",
  stats: "“এক নজরে” সংখ্যাগুলোর ব্যান্ড",
  vision: "মূল লক্ষ্য ও স্তম্ভসমূহ (সাইট সেটিংসের ভিশন থেকে)",
  programs: "চলমান প্রোগ্রামের কার্ড (কোর্স থেকে স্বয়ংক্রিয়)",
  research: "গবেষণা হাইলাইট (প্রকাশনা থেকে স্বয়ংক্রিয়)",
  notices: "সাম্প্রতিক বিজ্ঞপ্তি (নোটিশ বোর্ড থেকে স্বয়ংক্রিয়)",
  campus: "ক্যাম্পাস লাইফ গ্যালারি",
  media: "মিডিয়া হাব ঝলক",
  leadership: "নেতৃত্ব ও শিক্ষকবৃন্দ (পিপল থেকে স্বয়ংক্রিয়)",
  support: "অনুদান আহ্বান সেকশন",
  fatwa: "ফতোয়া গেটওয়ে সেকশন",
};

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Home section list: enable toggle, up/down reorder, editable titles. */
export function HomeSectionsManager({ sections }: { sections: HomeSectionRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(sections);
  const [dirty, setDirty] = useState<Record<string, Partial<HomeSectionRow>>>({});
  const [saving, setSaving] = useState(false);

  function patch(key: string, fields: Partial<HomeSectionRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...fields } : r)));
    setDirty((prev) => ({ ...prev, [key]: { ...(prev[key] ?? {}), ...fields } }));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    const updates = next.map((row, i) => ({ key: row.key, sortOrder: i }));
    setRows(next);
    setDirty((prev) => {
      const merged = { ...prev };
      for (const u of updates) merged[u.key] = { ...(merged[u.key] ?? {}), sortOrder: u.sortOrder };
      return merged;
    });
  }

  async function save() {
    if (saving) return;
    const updates = rows.map((row) => ({
      key: row.key,
      ...(dirty[row.key] ?? {}),
    }));
    setSaving(true);
    try {
      const res = await fetch("/api/admin/home-sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ updates }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      setDirty({});
      toast({ title: "হোম সেকশন সংরক্ষিত হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const dirtyCount = Object.keys(dirty).length;

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="font-heading text-base font-bold">সেকশনের ক্রম ও সক্রিয়তা</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            উপরের সেকশন আগে দেখাবে; বন্ধ সেকশন হোম পেজে আসে না।
          </p>
        </div>
        <Button onClick={save} disabled={saving || dirtyCount === 0} size="sm">
          {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
          {dirtyCount > 0 ? `সংরক্ষণ (${formatNumber(dirtyCount, "bn")})` : "সংরক্ষণ"}
        </Button>
      </div>

      <ul className="divide-y">
        {rows.map((row, index) => (
          <li key={row.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-7 text-center text-[12px] font-bold text-muted-foreground">
                {formatNumber(index + 1, "bn")}
              </span>
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`${row.titleBn} উপরে সরান`}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === rows.length - 1}
                  aria-label={`${row.titleBn} নিচে সরান`}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
              <label className="block">
                <span className="sr-only">বাংলা শিরোনাম</span>
                <Input
                  value={row.titleBn}
                  onChange={(e) => patch(row.key, { titleBn: e.target.value })}
                  placeholder="বাংলা শিরোনাম"
                  className="h-9 text-[13.5px]"
                  dir="ltr"
                />
              </label>
              <label className="block">
                <span className="sr-only">English title</span>
                <Input
                  value={row.titleEn}
                  onChange={(e) => patch(row.key, { titleEn: e.target.value })}
                  placeholder="English title"
                  className="h-9 text-[13.5px]"
                  dir="ltr"
                />
              </label>
              <p className="text-[11.5px] text-muted-foreground sm:col-span-2">
                <code className="rounded bg-secondary/60 px-1.5 py-0.5 text-[10.5px]" dir="ltr">
                  {row.key}
                </code>{" "}
                {SECTION_HINTS[row.key] ?? ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2.5 self-start sm:self-center">
              <Switch
                checked={row.isEnabled}
                onCheckedChange={(checked) => patch(row.key, { isEnabled: checked })}
                aria-label={`${row.titleBn} ${row.isEnabled ? "বন্ধ" : "চালু"} করুন`}
              />
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                  row.isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {row.isEnabled ? <Eye aria-hidden className="h-3 w-3" /> : <EyeOff aria-hidden className="h-3 w-3" />}
                {row.isEnabled ? "সক্রিয়" : "বন্ধ"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
