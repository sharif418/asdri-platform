"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { MediaPicker, type PickedMedia } from "@/components/admin/ui/media-picker";

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** Hero image chooser — writes the `site.hero` setting ({mediaId}). */
export function HeroImageManager({ current }: { current: PickedMedia | null }) {
  const router = useRouter();
  const [picked, setPicked] = useState<PickedMedia | null>(current);
  const [saving, setSaving] = useState(false);

  async function save(mediaId: string | null) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ key: "site.hero", value: { mediaId } }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "সংরক্ষণ করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: mediaId ? "হিরো ছবি সংরক্ষিত হয়েছে" : "হিরো ছবি মুছে ফেলা হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="border-b p-5">
        <h2 className="font-heading text-base font-bold">হিরো ইমেজ</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          হোম পেজের শীর্ষ ব্যানারের ছবি — মিডিয়া লাইব্রেরি থেকে বেছে নিন। খালি রাখলে ডিফল্ট ক্যাম্পাস ছবি দেখাবে।
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-xl border bg-secondary/40">
          {picked ? (
            <img
              src={`/api/media/${picked.key}`}
              alt={picked.filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <ImageIcon aria-hidden className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MediaPicker
            current={picked}
            onSelect={(media) => {
              setPicked(media);
              if (media) void save(media.id);
              else void save(null);
            }}
            kind="IMAGE"
            label="হিরো ছবি বদলান"
          />
          {picked ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPicked(null);
                void save(null);
              }}
              disabled={saving}
            >
              {saving ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden className="h-4 w-4" />
              )}
              ডিফল্টে ফেরান
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
