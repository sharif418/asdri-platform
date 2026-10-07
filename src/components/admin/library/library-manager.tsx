"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, FileText, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toBnDigits } from "@/lib/format";
import { adminConfirm } from "@/components/admin/ui/confirm";
import { LIBRARY_TYPE_LABELS_BN, emptyLibraryItemDraft, type LibraryCategoryOption, type LibraryItemDraft } from "@/components/admin/library/library-shared";
import { LibraryItemDialog } from "@/components/admin/library/library-item-dialog";
import { LIBRARY_ITEM_TYPES } from "@/lib/validators/admin-library";
import type { LibraryItemType } from "@prisma/client";

/** One row of the manager table — the shape GET /api/admin/library returns. */
interface ItemRow {
  id: string;
  slug: string;
  type: LibraryItemType;
  titleBn: string;
  titleEn: string;
  publishYear: number | null;
  visibility: "PUBLIC" | "MEMBERS";
  isPublished: boolean;
  category: { id: string; nameBn: string; nameEn: string } | null;
  publisher: { id: string; nameBn: string; nameEn: string } | null;
  creators: { role: "AUTHOR" | "EDITOR" | "TRANSLATOR"; creator: { id: string; nameBn: string; nameEn: string } }[];
  media: { id: string; filename: string; key: string } | null;
  coverMedia: { id: string; filename: string; key: string } | null;
  _count: { readings: number; checkouts: number };
  // fields the edit dialog needs (fetched alongside the list row)
  subtitleBn: string;
  subtitleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  language: string;
  volume: string;
  issueLabel: string;
  journalKey: string;
  journalNameBn: string;
  journalNameEn: string;
  externalUrl: string | null;
  filePages: number | null;
  isbn: string | null;
  issn: string | null;
  doi: string | null;
  editionBn: string;
  publishPlaceBn: string;
  categoryId: string | null;
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Row → dialog draft (strings for the controlled inputs). */
function rowToDraft(row: ItemRow): LibraryItemDraft {
  return {
    id: row.id,
    type: row.type,
    titleBn: row.titleBn,
    titleEn: row.titleEn,
    subtitleBn: row.subtitleBn,
    subtitleEn: row.subtitleEn,
    descriptionBn: row.descriptionBn,
    descriptionEn: row.descriptionEn,
    language: (["bn", "en", "ar", "mixed"] as const).includes(row.language as "bn") ? (row.language as LibraryItemDraft["language"]) : "bn",
    categoryId: row.categoryId ?? row.category?.id ?? "",
    creators: row.creators.map((link) => ({ nameBn: link.creator.nameBn, nameEn: link.creator.nameEn, role: link.role })),
    publisherBn: row.publisher?.nameBn ?? "",
    publisherEn: row.publisher?.nameEn ?? "",
    publishYear: row.publishYear != null ? String(row.publishYear) : "",
    publishPlaceBn: row.publishPlaceBn,
    isbn: row.isbn ?? "",
    issn: row.issn ?? "",
    doi: row.doi ?? "",
    editionBn: row.editionBn,
    volume: row.volume,
    issueLabel: row.issueLabel,
    journalNameBn: row.journalNameBn,
    journalNameEn: row.journalNameEn,
    journalKey: row.journalKey,
    externalUrl: row.externalUrl ?? "",
    visibility: row.visibility,
    isPublished: row.isPublished,
    filePages: row.filePages != null ? String(row.filePages) : "",
    media: row.media ? { id: row.media.id, filename: row.media.filename, key: row.media.key } : null,
    cover: row.coverMedia ? { id: row.coverMedia.id, filename: row.coverMedia.filename, key: row.coverMedia.key } : null,
  };
}

type TypeFilter = "ALL" | LibraryItemType;

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: "ALL", label: "সব" },
  ...LIBRARY_ITEM_TYPES.map((type) => ({ value: type as TypeFilter, label: LIBRARY_TYPE_LABELS_BN[type] })),
];

/** Catalogue manager — search, type tabs, table, create/edit dialog, delete. */
export function LibraryManager({ categories }: { categories: LibraryCategoryOption[] }) {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryItemDraft | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/admin/library?${params.toString()}`);
      const json = (await res.json()) as { ok: boolean; data?: { items: ItemRow[]; total: number } };
      if (json.ok && json.data) {
        setItems(json.data.items);
        setTotal(json.data.total);
      } else {
        toast({ title: "তালিকা আনা যায়নি", variant: "destructive" });
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [q, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), q ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, q]);

  const filteredLabel = useMemo(() => {
    const shown = items.length;
    return typeFilter === "ALL" ? `${toBnDigits(shown)} / ${toBnDigits(total)}টি আইটেম` : `${toBnDigits(shown)}টি ${LIBRARY_TYPE_LABELS_BN[typeFilter]}`;
  }, [items, total, typeFilter]);

  async function remove(row: ItemRow) {
    if (!(await adminConfirm({ title: `'${row.titleBn}' আইটেমটি স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?` }))) return;
    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/library/${row.id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken() } });
      if (res.ok) {
        toast({ title: "আইটেমটি মুছে ফেলা হয়েছে" });
        void load();
      } else {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="ধরন অনুসারে ফিল্টার" className="flex flex-wrap gap-1 rounded-xl border bg-secondary/40 p-1">
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={typeFilter === tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={
                typeFilter === tab.value
                  ? "rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground"
                  : "rounded-lg px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus aria-hidden className="h-4 w-4" />
          নতুন আইটেম
        </Button>
      </div>

      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="শিরোনাম, স্লাগ বা জার্নালের নাম দিয়ে খুঁজুন…"
          aria-label="আইটেম অনুসন্ধান"
          className="w-full rounded-lg border bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary/50"
        />
      </form>

      <p className="text-[12px] text-muted-foreground">{loading ? "লোড হচ্ছে…" : filteredLabel}</p>

      <div className="max-h-[62vh] overflow-x-auto overflow-y-auto rounded-2xl border bg-card shadow-sm">
        {items.length === 0 && !loading ? (
          <div className="px-6 py-16 text-center">
            <BookOpen aria-hidden className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="font-heading mt-2 text-lg font-bold">কোনো আইটেম নেই</p>
            <p className="mt-1 text-sm text-muted-foreground">প্রথম বই বা জার্নাল সংখ্যাটি যোগ করুন।</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b bg-secondary/30 text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-semibold">শিরোনাম</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">ধরন</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">ক্যাটাগরি</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">দৃশ্যমানতা</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">বছর</th>
                <th className="hidden px-4 py-3 font-semibold xl:table-cell">অবস্থা</th>
                <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-secondary/20">
                  <td className="max-w-md px-4 py-3">
                    <span className="flex items-center gap-3">
                      {row.coverMedia ? (
                        <img src={`/api/media/${row.coverMedia.key}`} alt="" className="h-11 w-8 shrink-0 rounded bg-secondary/40 object-cover" />
                      ) : (
                        <span className="flex h-11 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                          <FileText aria-hidden className="h-4 w-4" />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate font-medium" dir="auto">
                          {row.titleBn}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-muted-foreground" dir="ltr">
                          {row.slug}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{LIBRARY_TYPE_LABELS_BN[row.type]}</span>
                  </td>
                  <td className="hidden max-w-40 truncate px-4 py-3 text-[12.5px] text-muted-foreground md:table-cell">{row.category?.nameBn ?? "—"}</td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", row.visibility === "PUBLIC" ? "bg-primary/10 text-primary" : "bg-gold/15 text-gold-foreground")}>
                      {row.visibility === "PUBLIC" ? "পাবলিক" : "সদস্য"}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-[12.5px] font-semibold tabular-nums lg:table-cell" dir="ltr">
                    {row.publishYear != null ? toBnDigits(row.publishYear) : "—"}
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell">
                    <span className={cn("text-[11.5px] font-semibold", row.isPublished ? "text-primary" : "text-muted-foreground")}>
                      {row.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <a
                      href={`/research/library/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                    >
                      <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                      ওয়েবসাইটে দেখুন
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`${row.titleBn} সম্পাদনা`}
                      onClick={() => {
                        setEditing(rowToDraft(row));
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil aria-hidden className="h-4 w-4" />
                      সম্পাদনা
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`${row.titleBn} মুছুন`}
                      onClick={() => void remove(row)}
                      disabled={deletingId === row.id}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      {deletingId === row.id ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden className="h-4 w-4" />}
                      মুছুন
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Rendered only while open so every session starts from the current
          draft (useState initialises once per mount — a permanently mounted
          dialog would keep the previous item's values and id). */}
      {dialogOpen ? (
        <LibraryItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editing ?? emptyLibraryItemDraft()}
          categories={categories}
          mode={editing ? "edit" : "create"}
          onSaved={() => void load()}
        />
      ) : null}
    </div>
  );
}
