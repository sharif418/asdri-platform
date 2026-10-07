"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BilingualField, LanguageStatus } from "@/components/admin/ui/bilingual-field";
import { RichTextEditor } from "@/components/admin/ui/rich-text-editor";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import { GeneralError, fieldId, useFieldErrors } from "@/components/admin/ui/form-errors";
import { sanitizeRichTextPreview } from "@/lib/sanitize";
import { slugifyTitle } from "@/lib/slug";
import { deriveJournalKey } from "@/lib/library";
import {
  LIBRARY_LANGUAGE_LABELS_BN,
  LIBRARY_ROLE_LABELS_BN,
  LIBRARY_TYPE_LABELS_BN,
  type LibraryCategoryOption,
  type LibraryCreatorRow,
  type LibraryItemDraft,
} from "@/components/admin/library/library-shared";
import { LIBRARY_CREATOR_ROLES, LIBRARY_ITEM_TYPES, LIBRARY_LANGUAGES, LIBRARY_VISIBILITIES } from "@/lib/validators/admin-library";
import type { LibraryCreatorRole, LibraryItemType, LibraryVisibility } from "@prisma/client";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

const inputClass = "w-full rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:border-primary/50";
const labelClass = "block space-y-1.5";
const labelTextClass = "text-sm font-semibold";

/** Create/edit dialog for a catalogue item — the librarian's full record sheet. */
export function LibraryItemDialog({
  open,
  onOpenChange,
  initial,
  categories,
  mode,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: LibraryItemDraft;
  categories: LibraryCategoryOption[];
  mode: "create" | "edit";
  onSaved: () => void;
}) {
  const [values, setValues] = useState<LibraryItemDraft>(initial);
  const [saving, setSaving] = useState(false);
  const fe = useFieldErrors();

  const slugPreview = useMemo(() => slugifyTitle(values.titleEn || values.titleBn), [values.titleEn, values.titleBn]);
  const journalKeyPreview = useMemo(
    () => deriveJournalKey(values.journalKey, values.journalNameEn, values.journalNameBn),
    [values.journalKey, values.journalNameEn, values.journalNameBn],
  );

  function set<K extends keyof LibraryItemDraft>(key: K, value: LibraryItemDraft[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setCreator(index: number, patch: Partial<LibraryCreatorRow>) {
    setValues((v) => ({
      ...v,
      creators: v.creators.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    fe.clear();
    try {
      const payload = {
        type: values.type,
        titleBn: values.titleBn,
        titleEn: values.titleEn,
        subtitleBn: values.subtitleBn,
        subtitleEn: values.subtitleEn,
        descriptionBn: sanitizeRichTextPreview(values.descriptionBn),
        descriptionEn: sanitizeRichTextPreview(values.descriptionEn),
        language: values.language,
        categoryId: values.categoryId || null,
        creators: values.creators.filter((c) => c.nameBn.trim().length >= 2),
        publisher: values.publisherBn.trim().length >= 2 ? { nameBn: values.publisherBn.trim(), nameEn: values.publisherEn.trim() } : null,
        publishYear: values.publishYear ? Number.parseInt(values.publishYear, 10) : null,
        publishPlaceBn: values.publishPlaceBn,
        isbn: values.isbn.trim(),
        issn: values.issn.trim(),
        doi: values.doi.trim(),
        editionBn: values.editionBn,
        volume: values.volume.trim(),
        issueLabel: values.issueLabel.trim(),
        journalNameBn: values.journalNameBn.trim(),
        journalNameEn: values.journalNameEn.trim(),
        journalKey: values.journalKey.trim(),
        mediaId: values.media?.id ?? null,
        coverMediaId: values.cover?.id ?? null,
        filePages: values.filePages ? Number.parseInt(values.filePages, 10) : null,
        externalUrl: values.externalUrl.trim(),
        visibility: values.visibility,
        isPublished: values.isPublished,
      };
      const res = await fetch(mode === "create" ? "/api/admin/library" : `/api/admin/library/${values.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const summary = fe.setFromResponse(json) ?? "সংরক্ষণ করা যায়নি";
        toast({ title: summary, variant: "destructive" });
        return;
      }
      toast({ title: mode === "create" ? "আইটেম তৈরি হয়েছে" : "সংরক্ষিত হয়েছে" });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.parentId ? `— ${category.nameBn}` : category.nameBn,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{mode === "create" ? "নতুন লাইব্রেরি আইটেম" : "আইটেম সম্পাদনা"}</DialogTitle>
          <DialogDescription>
            বই, জার্নাল সংখ্যা, রিসার্চ পেপার বা ডিজিটাল ফাইল — পিডিএফ ও প্রচ্ছদ মিডিয়া লাইব্রেরি থেকে সংযুক্ত হয়।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <GeneralError message={fe.general} />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>ধরন</span>
              <select
                id={fieldId("type")}
                value={values.type}
                onChange={(e) => set("type", e.target.value as LibraryItemType)}
                className={inputClass}
              >
                {LIBRARY_ITEM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {LIBRARY_TYPE_LABELS_BN[type]}
                  </option>
                ))}
              </select>
              <fe.ErrorText name="type" />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>ভাষা</span>
              <select
                value={values.language}
                onChange={(e) => set("language", e.target.value as LibraryItemDraft["language"])}
                className={inputClass}
              >
                {LIBRARY_LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {LIBRARY_LANGUAGE_LABELS_BN[lang]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <BilingualField label="শিরোনাম" required>
            {(active) => (
              <>
                {active === "bn" ? (
                  <>
                    <input
                      id={fieldId("titleBn")}
                      value={values.titleBn}
                      onChange={(e) => set("titleBn", e.target.value)}
                      placeholder="বাংলা শিরোনাম"
                      aria-invalid={fe.errors.titleBn ? true : undefined}
                      className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] font-heading outline-none focus:border-primary/50"
                    />
                    <fe.ErrorText name="titleBn" />
                  </>
                ) : (
                  <>
                    <input
                      id={fieldId("titleEn")}
                      value={values.titleEn}
                      onChange={(e) => set("titleEn", e.target.value)}
                      placeholder="English title"
                      dir="ltr"
                      aria-invalid={fe.errors.titleEn ? true : undefined}
                      className="w-full rounded-lg border bg-card px-3.5 py-2.5 text-[15px] outline-none focus:border-primary/50"
                    />
                    <fe.ErrorText name="titleEn" />
                  </>
                )}
              </>
            )}
          </BilingualField>

          <BilingualField label="উপশিরোনাম">
            {(active) => (
              <Input
                dir={active === "en" ? "ltr" : undefined}
                value={active === "bn" ? values.subtitleBn : values.subtitleEn}
                onChange={(e) => set(active === "bn" ? "subtitleBn" : "subtitleEn", e.target.value)}
                placeholder={active === "bn" ? "ঐচ্ছিক উপশিরোনাম" : "Optional subtitle"}
                className={inputClass}
              />
            )}
          </BilingualField>

          <BilingualField label="বিবরণ" hint="পাঠকের পাতায় দেখানো হয় — ফরম্যাট করা লেখা চলে।">
            {(active) =>
              active === "bn" ? (
                <RichTextEditor value={values.descriptionBn} onChange={(html) => set("descriptionBn", html)} label="বিবরণ (বাংলা)" placeholder="বইয়ের পরিচিতি…" />
              ) : (
                <RichTextEditor value={values.descriptionEn} onChange={(html) => set("descriptionEn", html)} label="Description (English)" placeholder="Item description…" />
              )
            }
          </BilingualField>

          {/* Creators repeater */}
          <div className="space-y-2 rounded-xl border bg-secondary/20 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">লেখক / সম্পাদক / অনুবাদক</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => set("creators", [...values.creators, { nameBn: "", nameEn: "", role: "AUTHOR" }])}
              >
                <Plus aria-hidden className="h-3.5 w-3.5" />
                যোগ করুন
              </Button>
            </div>
            {values.creators.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">নাম লিখে যোগ করুন — একই নাম আগে থেকে থাকলে সেটিই ব্যবহার হবে।</p>
            ) : null}
            {values.creators.map((creator, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_130px_36px]">
                <Input
                  value={creator.nameBn}
                  onChange={(e) => setCreator(index, { nameBn: e.target.value })}
                  placeholder="বাংলা নাম"
                  aria-label={`স্রষ্টা ${index + 1} বাংলা নাম`}
                  className={inputClass}
                />
                <Input
                  dir="ltr"
                  value={creator.nameEn}
                  onChange={(e) => setCreator(index, { nameEn: e.target.value })}
                  placeholder="English name"
                  aria-label={`স্রষ্টা ${index + 1} ইংরেজি নাম`}
                  className={inputClass}
                />
                <select
                  value={creator.role}
                  onChange={(e) => setCreator(index, { role: e.target.value as LibraryCreatorRole })}
                  aria-label={`স্রষ্টা ${index + 1} ভূমিকা`}
                  className={inputClass}
                >
                  {LIBRARY_CREATOR_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {LIBRARY_ROLE_LABELS_BN[role]}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`স্রষ্টা ${index + 1} বাদ দিন`}
                  onClick={() => set("creators", values.creators.filter((_, i) => i !== index))}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <fe.ErrorText name="creators" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>ক্যাটাগরি</span>
              <select value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputClass}>
                <option value="">— ক্যাটাগরি নেই —</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <fe.ErrorText name="categoryId" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={labelClass}>
                <span className={labelTextClass}>প্রকাশক (বাংলা)</span>
                <Input value={values.publisherBn} onChange={(e) => set("publisherBn", e.target.value)} placeholder="আস-সুন্নাহ ফাউন্ডেশন" className={inputClass} />
              </label>
              <label className={labelClass}>
                <span className={labelTextClass}>প্রকাশক (ইংরেজি)</span>
                <Input dir="ltr" value={values.publisherEn} onChange={(e) => set("publisherEn", e.target.value)} placeholder="As-Sunnah Foundation" className={inputClass} />
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelTextClass}>প্রকাশের সাল</span>
              <Input
                id={fieldId("publishYear")}
                dir="ltr"
                type="number"
                min={1400}
                max={2100}
                value={values.publishYear}
                onChange={(e) => set("publishYear", e.target.value)}
                placeholder="2025"
                className={inputClass}
              />
              <fe.ErrorText name="publishYear" />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>প্রকাশস্থল</span>
              <Input value={values.publishPlaceBn} onChange={(e) => set("publishPlaceBn", e.target.value)} placeholder="ঢাকা" className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>সংস্করণ</span>
              <Input value={values.editionBn} onChange={(e) => set("editionBn", e.target.value)} placeholder="১ম সংস্করণ" className={inputClass} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelTextClass}>ISBN</span>
              <Input id={fieldId("isbn")} dir="ltr" value={values.isbn} onChange={(e) => set("isbn", e.target.value)} placeholder="978-…" className={inputClass} />
              <fe.ErrorText name="isbn" />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>ISSN</span>
              <Input id={fieldId("issn")} dir="ltr" value={values.issn} onChange={(e) => set("issn", e.target.value)} placeholder="2789-…" className={inputClass} />
              <fe.ErrorText name="issn" />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>DOI</span>
              <Input id={fieldId("doi")} dir="ltr" value={values.doi} onChange={(e) => set("doi", e.target.value)} placeholder="10.xxxx/…" className={inputClass} />
              <fe.ErrorText name="doi" />
            </label>
          </div>

          {values.type === "JOURNAL_ISSUE" ? (
            <div className="space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-3.5">
              <p className="text-sm font-semibold">জার্নাল তথ্য</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  <span className={labelTextClass}>জার্নালের নাম (বাংলা)</span>
                  <Input value={values.journalNameBn} onChange={(e) => set("journalNameBn", e.target.value)} placeholder="আস-সুন্নাহ জার্নাল" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>জার্নালের নাম (ইংরেজি)</span>
                  <Input dir="ltr" value={values.journalNameEn} onChange={(e) => set("journalNameEn", e.target.value)} placeholder="As-Sunnah Journal" className={inputClass} />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <label className={labelClass}>
                  <span className={labelTextClass}>খণ্ড (Volume)</span>
                  <Input dir="ltr" value={values.volume} onChange={(e) => set("volume", e.target.value)} placeholder="১ / Vol. 1" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>সংখ্যা লেবেল</span>
                  <Input value={values.issueLabel} onChange={(e) => set("issueLabel", e.target.value)} placeholder="১ম সংখ্যা" className={inputClass} />
                </label>
                <label className={labelClass}>
                  <span className={labelTextClass}>জার্নাল কী</span>
                  <Input
                    dir="ltr"
                    value={values.journalKey}
                    onChange={(e) => set("journalKey", e.target.value)}
                    placeholder={journalKeyPreview || "auto"}
                    className={inputClass}
                  />
                  <span className="block text-[11px] text-muted-foreground" dir="ltr">
                    গ্রুপিং কী · খালি রাখলে: <code className="rounded bg-secondary px-1">{journalKeyPreview || "—"}</code>
                  </span>
                </label>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <p className={labelTextClass}>পিডিএফ ফাইল</p>
              <MediaPicker current={values.media} onSelect={(media) => set("media", media)} kind="DOCUMENT" compact label="পিডিএফ নির্বাচন" />
              <fe.ErrorText name="mediaId" />
            </div>
            <div className="space-y-2">
              <p className={labelTextClass}>প্রচ্ছদ (ছবি)</p>
              <MediaPicker current={values.cover} onSelect={(media) => set("cover", media)} kind="IMAGE" compact label="প্রচ্ছদ নির্বাচন" />
              <fe.ErrorText name="coverMediaId" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>বহিঃসংযোগ (ঐচ্ছিক)</span>
              <Input
                id={fieldId("externalUrl")}
                dir="ltr"
                value={values.externalUrl}
                onChange={(e) => set("externalUrl", e.target.value)}
                placeholder="https://…"
                className={inputClass}
              />
              <span className="block text-[11px] text-muted-foreground">ফাইল বাইরের সাইটে থাকলে সেই লিংক দিন।</span>
              <fe.ErrorText name="externalUrl" />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>পৃষ্ঠা সংখ্যা</span>
              <Input
                id={fieldId("filePages")}
                dir="ltr"
                type="number"
                min={1}
                value={values.filePages}
                onChange={(e) => set("filePages", e.target.value)}
                placeholder="১২৮"
                className={inputClass}
              />
              <fe.ErrorText name="filePages" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              <span className={labelTextClass}>দৃশ্যমানতা</span>
              <select value={values.visibility} onChange={(e) => set("visibility", e.target.value as LibraryVisibility)} className={inputClass}>
                {LIBRARY_VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {visibility === "PUBLIC" ? "পাবলিক — সবার জন্য" : "সদস্য — লগইন করা পাঠকের জন্য"}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center justify-between rounded-xl border bg-secondary/30 p-3.5">
              <div>
                <p className="text-sm font-semibold">প্রকাশনা</p>
                <p className="text-[11.5px] text-muted-foreground">
                  আইটেম — বর্তমান অবস্থা: {values.isPublished ? "প্রকাশিত" : "ড্রাফট"}
                </p>
              </div>
              <Switch
                checked={values.isPublished}
                onCheckedChange={(checked) => set("isPublished", checked)}
                aria-label={`আইটেম — বর্তমান অবস্থা: ${values.isPublished ? "প্রকাশিত" : "ড্রাফট"}`}
              />
            </div>
          </div>

          <div className="border-t pt-3">
            <LanguageStatus hasBn={values.titleBn.length > 2} hasEn={values.titleEn.length > 2} />
            {mode === "create" && slugPreview ? (
              <p className="mt-1 text-[11px] text-muted-foreground" dir="ltr">
                স্লাগ: <code className="rounded bg-secondary px-1">{slugPreview}</code>
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            বাতিল
          </Button>
          <Button onClick={save} disabled={saving || values.titleBn.trim().length < 3} className="gap-1.5 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            {mode === "create" ? "আইটেম তৈরি করুন" : "পরিবর্তন সংরক্ষণ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
