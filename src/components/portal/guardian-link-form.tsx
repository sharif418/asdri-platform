"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Link2, Loader2, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoldRule } from "@/components/shared/ornaments";

/**
 * The guardian's own child-link form (round-10; restores the lost round-7
 * E.19 close): tracking number + family phone — both halves of what the
 * office already holds. Passing both links the child's application to this
 * account; the portal then shows the child card like any office-made link.
 */

const inputClass =
  "mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/50";

export function GuardianLinkForm() {
  const router = useRouter();
  const [trackingNo, setTrackingNo] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  async function onLink() {
    if (saving) return;
    if (!/^ASDRI-\d{4}-\d{6}$/.test(trackingNo.trim())) {
      toast({ title: "সঠিক ট্র্যাকিং নম্বর দিন (যেমন: ASDRI-2026-123456)", variant: "destructive" });
      return;
    }
    if (phone.trim().replace(/\D/g, "").length < 10) {
      toast({ title: "পরিবারের মোবাইল নম্বর দিন।", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/portal/guardian/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify({ trackingNo: trackingNo.trim(), phone: phone.trim() }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        error?: string;
        fields?: Record<string, string>;
        data?: { studentNameBn: string; already: boolean };
      };
      if (!res.ok || !json.ok) {
        const firstField = json.fields ? Object.values(json.fields)[0] : null;
        toast({ title: firstField ?? json.error ?? "সংযোগ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({
        title: json.data?.already
          ? "এই সন্তান এখনো আগেই আপনার সঙ্গে যুক্ত আছে"
          : `${json.data?.studentNameBn ?? "সন্তান"}-এর তথ্য এখন আপনার পোর্টালে`,
      });
      setTrackingNo("");
      setPhone("");
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-gold/25 bg-card p-5 pt-6 shadow-sm sm:p-6 sm:pt-7">
      {/* gold spine — the keepsake language every portal card shares */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gold-gradient" />

      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Link2 aria-hidden className="h-5 w-5 text-gold" />
        নিজের সন্তানের আবেদন যুক্ত করুন
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
        আবেদন জমার সময় যে ট্র্যাকিং নম্বর ও পরিবারের মোবাইল নম্বর দেওয়া হয়েছিল — দুটোই মিললে
        সন্তানের অগ্রগতি এই পোর্টালে দেখা যাবে ইনশাআল্লাহ।
      </p>
      <GoldRule className="my-4" />

      <div className="grid gap-4">
        <div>
          <Label htmlFor="gl-tracking">ট্র্যাকিং নম্বর *</Label>
          <div className="relative">
            <Hash aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="gl-tracking"
              className={`${inputClass} pl-9 font-mono tracking-wide`}
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value.toUpperCase().trim())}
              placeholder="ASDRI-2026-123456"
              dir="ltr"
              inputMode="text"
              autoComplete="off"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="gl-phone">পরিবারের মোবাইল নম্বর *</Label>
          <div className="relative">
            <Phone aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="gl-phone"
              className={`${inputClass} pl-9`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              dir="ltr"
              inputMode="tel"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            তথ্য না মিললে নিরাপত্তার জন্য বিস্তারিত কিছু জানানো হয় না — সহায়তা দরকার হলে অফিসে যোগাযোগ করুন।
          </p>
          <Button onClick={onLink} disabled={saving} className="shrink-0 gap-1.5">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Link2 aria-hidden className="h-4 w-4" />}
            সংযোগ করুন
          </Button>
        </div>
      </div>
    </section>
  );
}
