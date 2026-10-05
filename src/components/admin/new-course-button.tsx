"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Create a course shell (code + bilingual title) then jump into the editor. */
export function NewCourseButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState("");
  const [titleBn, setTitleBn] = useState("");
  const [titleEn, setTitleEn] = useState("");

  async function onCreate() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify({ code, titleBn, titleEn }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { slug: string } };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "তৈরি করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "কোর্স তৈরি হয়েছে — এখন কারিকুলাম সাজান" });
      setOpen(false);
      router.push(`/admin/courses/${json.data?.slug}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-semibold">
          <Plus aria-hidden className="h-4 w-4" />
          নতুন কোর্স
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>নতুন কোর্স তৈরি</DialogTitle>
          <DialogDescription>
            কোড ও নাম দিয়ে শুরু করুন — বাকি সব (কারিকুলাম, যোগ্যতা, কভার) পরের ধাপে।
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold">কোড *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="যেমন CCIS"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">বাংলা নাম *</label>
            <input
              value={titleBn}
              onChange={(e) => setTitleBn(e.target.value)}
              dir="rtl"
              placeholder="সার্টিফিকেট কোর্স ইন ইসলামিক স্টাডিজ"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 font-heading text-[15px]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">English name</label>
            <input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Certificate Course in Islamic Studies"
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onCreate} disabled={saving || !code || !titleBn} className="gap-2 font-semibold">
            {saving ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
            তৈরি করুন
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
