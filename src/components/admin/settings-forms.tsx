"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BilingualField } from "@/components/admin/ui/bilingual-field";
import type {
  SiteIdentity,
  SiteContact,
  SiteSocial,
  SitePayment,
  ZakatSetting,
} from "@/lib/settings";

type Draft<T> = { [K in keyof T]: string };

function toDraft(value: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, String(v ?? "")]));
}

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

const inputClass = "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50";

/** One settings section: heading + form + save button (PATCH /api/admin/settings). */
function SettingSection({
  title,
  description,
  settingKey,
  initial,
  render,
  numericFields = [],
}: {
  title: string;
  description: string;
  settingKey: string;
  initial: object;
  render: (draft: Record<string, string>, set: (field: string, value: string) => void) => React.ReactNode;
  numericFields?: string[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(toDraft(initial as Record<string, unknown>));
  const [saving, setSaving] = useState(false);

  const set = (field: string, value: string) => setDraft((prev) => ({ ...prev, [field]: value }));

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      // Numeric fields (zakat rates) parse to numbers; the rest stays string.
      const value = Object.fromEntries(
        Object.entries(draft).map(([k, v]) => [k, numericFields.includes(k) ? Number(v) || 0 : v]),
      );
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ key: settingKey, value }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const detail = json.fields ? ` (${Object.values(json.fields)[0] ?? ""})` : "";
        toast({ title: `${json.error ?? "সংরক্ষণ করা যায়নি"}${detail}`, variant: "destructive" });
        return;
      }
      toast({ title: `${title} সংরক্ষিত হয়েছে` });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-bold">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
        </div>
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
          সংরক্ষণ
        </Button>
      </div>
      <div className="mt-5 space-y-4">{render(draft, set)}</div>
    </section>
  );
}

const Field = ({
  label,
  value,
  onChange,
  ltr = true,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ltr?: boolean;
  placeholder?: string;
  hint?: string;
}) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-semibold">{label}</span>
    <Input dir={ltr ? "ltr" : undefined} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    {hint ? <span className="block text-[11.5px] text-muted-foreground">{hint}</span> : null}
  </label>
);

/** The five office-editable setting groups on one page. */
export function SettingsForms({
  identity,
  contact,
  social,
  payment,
  zakat,
}: {
  identity: SiteIdentity;
  contact: SiteContact;
  social: SiteSocial;
  payment: SitePayment;
  zakat: ZakatSetting;
}) {
  return (
    <div className="space-y-8">
      <SettingSection
        title="পরিচিতি"
        description="লোগোর নাম, অভিভাবক প্রতিষ্ঠান ও ট্যাগলাইন — হেডার ও ফুটারে দেখায়।"
        settingKey="site.identity"
        initial={identity}
        render={(draft, set) => (
          <>
            <BilingualField label="প্রতিষ্ঠানের নাম" required stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.nameBn : draft.nameEn}
                  onChange={(e) => set(active === "bn" ? "nameBn" : "nameEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
            <BilingualField label="অভিভাবক প্রতিষ্ঠান" stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.parentBn : draft.parentEn}
                  onChange={(e) => set(active === "bn" ? "parentBn" : "parentEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
            <BilingualField label="সংক্ষিপ্ত নাম" stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.shortBn : draft.shortEn}
                  onChange={(e) => set(active === "bn" ? "shortBn" : "shortEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
            <BilingualField label="ট্যাগলাইন">
              {(active) => (
                <Textarea
                  dir="ltr"
                  rows={2}
                  value={active === "bn" ? draft.taglineBn : draft.taglineEn}
                  onChange={(e) => set(active === "bn" ? "taglineBn" : "taglineEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
          </>
        )}
      />

      <SettingSection
        title="যোগাযোগ"
        description="ঠিকানা, ফোন, ইমেইল, অফিস সময় ও ম্যাপ — যোগাযোগ পেজ ও ফুটারে দেখায়।"
        settingKey="site.contact"
        initial={contact}
        render={(draft, set) => (
          <>
            <BilingualField label="কেন্দ্রীয় ঠিকানা">
              {(active) => (
                <Textarea
                  dir="ltr"
                  rows={2}
                  value={active === "bn" ? draft.addressBn : draft.addressEn}
                  onChange={(e) => set(active === "bn" ? "addressBn" : "addressEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
            <BilingualField label="ক্যাম্পাস ঠিকানা">
              {(active) => (
                <Textarea
                  dir="ltr"
                  rows={2}
                  value={active === "bn" ? draft.campusAddressBn : draft.campusAddressEn}
                  onChange={(e) => set(active === "bn" ? "campusAddressBn" : "campusAddressEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="ফোন"
                value={draft.phone}
                onChange={(v) => set("phone", v)}
                placeholder="+880 1805-437910"
                hint="ল্যাটিন সংখ্যায় লিখুন — সব ভাষায় এভাবেই দেখায়।"
              />
              <Field label="সাধারণ ইমেইল" value={draft.email} onChange={(v) => set("email", v)} placeholder="info@…" />
              <Field label="ভর্তি ইমেইল" value={draft.emailAdmission} onChange={(v) => set("emailAdmission", v)} placeholder="admission@…" />
            </div>
            <BilingualField label="অফিস সময়" stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.hoursBn : draft.hoursEn}
                  onChange={(e) => set(active === "bn" ? "hoursBn" : "hoursEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ম্যাপ (embed URL)" value={draft.mapsEmbed} onChange={(v) => set("mapsEmbed", v)} />
              <Field label="ম্যাপ (লিংক)" value={draft.mapsLink} onChange={(v) => set("mapsLink", v)} />
            </div>
            <BilingualField label="ভর্তি বিজ্ঞপ্তি নোট" stacked={false}>
              {(active) => (
                <Input
                  dir="ltr"
                  value={active === "bn" ? draft.admissionNoteBn : draft.admissionNoteEn}
                  onChange={(e) => set(active === "bn" ? "admissionNoteBn" : "admissionNoteEn", e.target.value)}
                  className={inputClass}
                />
              )}
            </BilingualField>
          </>
        )}
      />

      <SettingSection
        title="সোশ্যাল মিডিয়া"
        description="ফুটারের সোশ্যাল আইকনগুলোর লিংক।"
        settingKey="site.social"
        initial={social}
        render={(draft, set) => (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Facebook" value={draft.facebook} onChange={(v) => set("facebook", v)} placeholder="https://…" />
            <Field label="YouTube" value={draft.youtube} onChange={(v) => set("youtube", v)} placeholder="https://…" />
            <Field label="Twitter / X" value={draft.twitter} onChange={(v) => set("twitter", v)} placeholder="https://… (খালি রাখলে লুকায়)" />
            <Field label="WhatsApp" value={draft.whatsapp} onChange={(v) => set("whatsapp", v)} placeholder="https://… (খালি রাখলে লুকায়)" />
          </div>
        )}
      />

      <SettingSection
        title="পেমেন্ট চ্যানেল"
        description="অনুদান পেজের ম্যানুয়াল পেমেন্ট নম্বর — রিসিপ্টেও দেখায়।"
        settingKey="site.payment"
        initial={payment}
        render={(draft, set) => (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="bKash" value={draft.bkash} onChange={(v) => set("bkash", v)} />
              <Field label="Nagad" value={draft.nagad} onChange={(v) => set("nagad", v)} />
              <Field label="Rocket" value={draft.rocket} onChange={(v) => set("rocket", v)} />
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold">ব্যাংক হিসাব (বাংলা)</span>
              <Textarea dir="ltr" rows={3} value={draft.bankBn} onChange={(e) => set("bankBn", e.target.value)} className={inputClass} />
            </label>
          </>
        )}
      />

      <SettingSection
        title="যাকাত নিসাব ও স্বর্ণ-রূপার দাম"
        description="যাকাত ক্যালকুলেটরের হিসেবের ভিত্তি — প্রতি গ্রাম দাম টাকায়।"
        settingKey="donations.zakat"
        initial={zakat}
        numericFields={["nisabSilverGrams", "silverRateBdt", "nisabGoldGrams", "goldRateBdt"]}
        render={(draft, set) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="রূপার নিসাব (গ্রাম)" value={draft.nisabSilverGrams} onChange={(v) => set("nisabSilverGrams", v)} placeholder="52.5" />
            <Field label="রূপার দাম (৳/গ্রাম)" value={draft.silverRateBdt} onChange={(v) => set("silverRateBdt", v)} placeholder="145" />
            <Field label="স্বর্ণের নিসাব (গ্রাম)" value={draft.nisabGoldGrams} onChange={(v) => set("nisabGoldGrams", v)} placeholder="87.48" />
            <Field label="স্বর্ণের দাম (৳/গ্রাম)" value={draft.goldRateBdt} onChange={(v) => set("goldRateBdt", v)} placeholder="12500" />
          </div>
        )}
      />
    </div>
  );
}
