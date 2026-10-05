"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { langPath } from "@/lib/locale";
import type { Language } from "@/types";

interface VerifyEmailClientProps {
  lang: Language;
  token: string;
}

type Phase = "verifying" | "done" | "invalid";

/**
 * Client island for /verify-email: submits the one-time token to
 * /api/auth/verify-email once on mount and renders the bilingual outcome.
 */
export function VerifyEmailClient({ lang, token }: VerifyEmailClientProps) {
  const bn = lang === "bn";
  const [phase, setPhase] = useState<Phase>(token ? "verifying" : "invalid");
  const [message, setMessage] = useState("");
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json()) as { data?: { message?: string }; error?: string };
        if (!res.ok || !json.data) {
          setPhase("invalid");
          setMessage(json.error ?? (bn ? "লিংকটি কার্যকর হয়নি।" : "The link did not work."));
          return;
        }
        setPhase("done");
        setMessage(json.data.message ?? (bn ? "ইমেইল নিশ্চিত হয়েছে।" : "Your email is verified."));
      } catch {
        setPhase("invalid");
        setMessage(bn ? "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।" : "Network problem — please try again.");
      }
    })();
  }, [token, bn]);

  const accountLink = (
    <Link
      href={langPath(lang, "/account")}
      className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-5 py-2.5 text-sm font-bold text-gold-foreground shadow-md shadow-gold/20 transition-opacity hover:opacity-95"
    >
      {bn ? "অ্যাকাউন্টে যান" : "Go to account"}
    </Link>
  );

  const loginLink = (
    <Link
      href={langPath(lang, "/login")}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
    >
      {bn ? "লগইন করুন" : "Sign in"}
    </Link>
  );

  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
      {phase === "verifying" && (
        <>
          <Loader2 aria-hidden className="mx-auto h-10 w-10 animate-spin text-gold" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {bn ? "টোকেনটি যাচাই করা হচ্ছে…" : "Verifying your token…"}
          </p>
        </>
      )}

      {phase === "done" && (
        <>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 aria-hidden className="h-8 w-8 text-primary" />
          </span>
          <h2 className="font-heading mt-4 text-xl font-bold">{bn ? "ইমেইল নিশ্চিত হয়েছে" : "Email verified"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{message}</p>
          <div className="mt-6">{accountLink}</div>
        </>
      )}

      {phase === "invalid" && (
        <>
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle aria-hidden className="h-8 w-8 text-destructive" />
          </span>
          <h2 className="font-heading mt-4 text-xl font-bold">
            {bn ? "লিংকটি কার্যকর নয়" : "This link is not valid"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {message ||
              (bn
                ? "ভেরিফিকেশন টোকেন পাওয়া যায়নি — ইমেইলের লিংকটি সম্পূর্ণ কপি করে ব্রাউজারে খুলুন।"
                : "No verification token found — open the full link from the email.")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {loginLink}
            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
              <MailCheck aria-hidden className="h-3.5 w-3.5 text-gold/70" />
              {bn ? "লগইন করে নতুন লিংক চাইতে পারবেন" : "You can request a new link after signing in"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
