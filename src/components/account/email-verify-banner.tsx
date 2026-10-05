"use client";

import { useState } from "react";
import { Loader2, MailCheck, ShieldAlert } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Language } from "@/types";

interface EmailVerifyBannerProps {
  lang: Language;
}

/**
 * Banner shown on /account while the address is unverified, with the
 * rate-limited resend action (POST /api/auth/verify-email/resend).
 */
export function EmailVerifyBanner({ lang }: EmailVerifyBannerProps) {
  const bn = lang === "bn";
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json()) as { data?: { message?: string }; error?: string };
      if (!res.ok || !json.data) {
        toast({ title: json.error ?? (bn ? "লিংক পাঠানো যায়নি" : "Could not send the link"), variant: "destructive" });
        return;
      }
      setSent(true);
      toast({ title: json.data.message ?? (bn ? "নতুন লিংক পাঠানো হয়েছে" : "A new link has been sent") });
    } catch {
      toast({ title: bn ? "নেটওয়ার্ক সমস্যা" : "Network problem", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      role="status"
      className="mt-6 flex flex-col gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div>
          <p className="text-sm font-semibold">
            {bn ? "ইমেইল এখনো নিশ্চিত হয়নি" : "Your email is not verified yet"}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {bn
              ? "এই ঠিকানায় করা অনুদানের ইতিহাস দেখতে ইমেইল নিশ্চিত করতে হবে। রেজিস্ট্রেশনের সময় পাঠানো লিংকটি (মেয়াদ ৪৮ ঘণ্টা) ইনবক্স বা স্প্যাম ফোল্ডারে খুঁজুন।"
              : "Donation history tied to this address is hidden until the email is verified. Check your inbox (or spam) for the link sent at registration — it is valid for 48 hours."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={resend}
        disabled={sending || sent}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gold/50 bg-card px-4 py-2 text-[13px] font-semibold text-gold transition-colors hover:bg-gold/15 disabled:opacity-60"
      >
        {sending ? (
          <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MailCheck aria-hidden className="h-3.5 w-3.5" />
        )}
        {sent
          ? bn
            ? "লিংক পাঠানো হয়েছে"
            : "Link sent"
          : bn
            ? "নতুন লিংক পাঠান"
            : "Send a new link"}
      </button>
    </div>
  );
}
