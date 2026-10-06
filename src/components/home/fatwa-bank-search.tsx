"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/providers/language-provider";
import type { Language } from "@/types";

/**
 * Client-side filter for the server-rendered fatwa bank preview. The entries
 * live in the HTML (each <li> carries a lowercased data-search index of its
 * bn/en text); this island only flips `hidden` — no data is serialized into
 * the RSC payload, and without JS the full list simply stays visible.
 */
export function FatwaBankSearch({ lang }: { lang: Language }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const host = document.getElementById("fatwa-bank-list");
    const empty = document.getElementById("fatwa-bank-empty");
    if (!host) return;
    const q = query.trim().toLowerCase();
    let visible = 0;
    host.querySelectorAll<HTMLElement>("li[data-search]").forEach((item) => {
      const match = q.length === 0 || (item.dataset.search ?? "").includes(q);
      item.hidden = !match;
      if (match) visible += 1;
    });
    if (empty) empty.hidden = q.length === 0 || visible > 0;
  }, [query]);

  return (
    <div className="relative mt-5">
      <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          lang === "bn" ? "কী-ওয়ার্ড দিয়ে খুঁজুন (যেমন: যাকাত, কিবলা)…" : "Search by keyword (e.g. zakat, qiblah)…"
        }
        className="pl-9"
        aria-label={t("action.search")}
      />
    </div>
  );
}
