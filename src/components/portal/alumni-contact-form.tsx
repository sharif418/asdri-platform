"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The alumnus's self-service contact + present-life form. The first save on
 * an unclaimed office row also links the account (the claim); afterwards the
 * form always edits the linked row.
 */

const inputClass =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50";

interface FormState {
  phone: string;
  email: string;
  addressBn: string;
  occupationBn: string;
  organizationBn: string;
  districtBn: string;
}

export function AlumniContactForm({ initial }: { initial: FormState }) {
  const router = useRouter();
  const [values, setValues] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSave() {
    if (saving) return;
    if (values.email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      toast({ title: "ইমেইল ঠিকভাবে লিখুন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/alumni/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify({
          phone: values.phone.trim(),
          email: values.email.trim(),
          addressBn: values.addressBn.trim(),
          occupationBn: values.occupationBn.trim(),
          organizationBn: values.organizationBn.trim(),
          districtBn: values.districtBn.trim(),
        }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string> };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "আপনার তথ্য হালনাগাদ হয়েছে — জাযাকাল্লাহু খাইরান" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="al-self-phone">ফোন</Label>
          <Input
            id="al-self-phone"
            className={inputClass}
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="01XXXXXXXXX"
            dir="ltr"
          />
        </div>
        <div>
          <Label htmlFor="al-self-email">ইমেইল</Label>
          <Input
            id="al-self-email"
            className={inputClass}
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="name@example.com"
            dir="ltr"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="al-self-occupation">বর্তমান পেশা</Label>
          <Input
            id="al-self-occupation"
            className={inputClass}
            value={values.occupationBn}
            onChange={(e) => set("occupationBn", e.target.value)}
            placeholder="ইমাম ও খতিব / শিক্ষক / গবেষক"
          />
        </div>
        <div>
          <Label htmlFor="al-self-organization">প্রতিষ্ঠান</Label>
          <Input
            id="al-self-organization"
            className={inputClass}
            value={values.organizationBn}
            onChange={(e) => set("organizationBn", e.target.value)}
            placeholder="জামিয়া …"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="al-self-district">জেলা</Label>
          <Input
            id="al-self-district"
            className={inputClass}
            value={values.districtBn}
            onChange={(e) => set("districtBn", e.target.value)}
            placeholder="ঢাকা"
          />
        </div>
        <div>
          <Label htmlFor="al-self-address">ঠিকানা</Label>
          <Input
            id="al-self-address"
            className={inputClass}
            value={values.addressBn}
            onChange={(e) => set("addressBn", e.target.value)}
            placeholder="গ্রাম/মহল্লা, ডাকঘর, জেলা"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          এই তথ্য শুধু অফিস দেখে — প্রকাশ্য ডিরেক্টরিতে কখনোই যোগাযোগের তথ্য দেখানো হয় না।
        </p>
        <Button onClick={onSave} disabled={saving} className="shrink-0 gap-1.5">
          {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Send aria-hidden className="h-4 w-4" />}
          হালনাগাদ করুন
        </Button>
      </div>
    </div>
  );
}
