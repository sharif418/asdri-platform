"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BilingualField } from "@/components/admin/ui/bilingual-field";

interface AdmissionCopy {
  declarationBn: string;
  declarationEn: string;
  applyIntroBn: string;
  applyIntroEn: string;
}

const inputClass = "w-full rounded-lg border bg-card px-3.5 py-2.5 text-sm outline-none focus:border-primary/50";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Editor for the `admissions.settings` blob (declaration + apply intro). */
export function AdmissionCopyForm({ initial }: { initial: AdmissionCopy }) {
  const router = useRouter();
  const [values, setValues] = useState<AdmissionCopy>(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ key: "admissions.settings", value: values }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "ভর্তির লেখা সংরক্ষিত হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="space-y-5">
        <BilingualField
          label="আবেদন ফর্মের ঘোষণাপত্র"
          required
          hint="আবেদনকারী “আমি ঘোষণা করছি” বক্সে যা দেখে সম্মতি দেয়।"
        >
          {(active) => (
            <Textarea
              dir="ltr"
              rows={4}
              value={active === "bn" ? values.declarationBn : values.declarationEn}
              onChange={(e) =>
                setValues(active === "bn" ? { ...values, declarationBn: e.target.value } : { ...values, declarationEn: e.target.value })
              }
              placeholder={active === "bn" ? "আমি ঘোষণা করছি যে…" : "I declare that…"}
              className={inputClass}
            />
          )}
        </BilingualField>

        <BilingualField
          label="আবেদন পেজের ভূমিকা"
          hint="অনলাইন আবেদন ফর্মের উপরে দেখানো হবে (খালি রাখলে দেখাবে না)।"
        >
          {(active) => (
            <Textarea
              dir="ltr"
              rows={3}
              value={active === "bn" ? values.applyIntroBn : values.applyIntroEn}
              onChange={(e) =>
                setValues(active === "bn" ? { ...values, applyIntroBn: e.target.value } : { ...values, applyIntroEn: e.target.value })
              }
              placeholder={active === "bn" ? "ইনটেক বেছে নিয়ে সঠিক তথ্য পূরণ করুন…" : "Shown above the application form…"}
              className={inputClass}
            />
          )}
        </BilingualField>

        <div className="flex justify-end border-t pt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Save aria-hidden className="h-4 w-4" />}
            সংরক্ষণ করুন
          </Button>
        </div>
      </div>
    </section>
  );
}
