"use client";

import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

/**
 * প্রিভিউ লিংক — mints a 24-hour signed preview URL for a saved Notice/Post
 * (POST /api/admin/preview-link) and copies it to the clipboard. The office
 * hands the URL to a reviewer; drafts render exactly like the published page.
 */
export function PreviewLinkButton({
  entity,
  entityId,
}: {
  entity: "Notice" | "Post";
  entityId: string;
}) {
  const [creating, setCreating] = useState(false);

  async function onPreviewLink() {
    if (creating || !entityId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/preview-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "",
        },
        body: JSON.stringify({ entity, entityId }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { url: string } };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "প্রিভিউ লিংক তৈরি করা যায়নি", variant: "destructive" });
        return;
      }
      const url = `${window.location.origin}${json.data.url}`;
      try {
        await navigator.clipboard.writeText(url);
        toast({ title: "প্রিভিউ লিংক কপি হয়েছে", description: "লিংকটি ২৪ ঘণ্টার জন্য বৈধ।" });
      } catch {
        // Clipboard write denied (permissions / headless) — surface the link.
        toast({ title: "প্রিভিউ লিংক তৈরি হয়েছে (কপি করা যায়নি)", description: url });
      }
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <Button
      onClick={() => void onPreviewLink()}
      disabled={creating}
      variant="outline"
      size="sm"
      className="w-full gap-1.5"
    >
      {creating ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <Link2 aria-hidden className="h-3.5 w-3.5" />}
      প্রিভিউ লিংক
    </Button>
  );
}
