"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The invitation acceptance form: the invitee sees what they were invited as,
 * sets a password, and lands directly in their portal (or the admin for
 * staff roles) — one flow, no login round-trip.
 */
export function AcceptInviteForm({
  token,
  name,
  roleLabel,
  courseLabel,
}: {
  token: string;
  name: string;
  roleLabel: string;
  courseLabel: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 10) {
      setError("পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirm) {
      setError("দুটি পাসওয়ার্ড এক নয়।");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; home?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "অ্যাকাউন্ট চালু করা যায়নি — আবার চেষ্টা করুন।");
        setBusy(false);
        return;
      }
      router.replace(json.home ?? "/portal");
      router.refresh();
    } catch {
      setError("নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন।");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-gold/20 bg-card p-8 shadow-xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[12px] font-semibold text-gold">
        <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
        আমন্ত্রণ গৃহীত হয়েছে
      </span>
      <h1 className="font-heading mt-4 text-2xl font-bold">স্বাগতম, {name}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        আপনাকে <strong className="text-foreground">{roleLabel}</strong> হিসেবে আমন্ত্রণ জানানো হয়েছে।
        {courseLabel ? (
          <>
            {" "}
            নির্ধারিত কোর্স: <strong className="text-foreground">{courseLabel}</strong>।
          </>
        ) : null}{" "}
        একটি পাসওয়ার্ড দিয়ে অ্যাকাউন্টটি চালু করুন।
      </p>

      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="invite-password" className="text-[13px] font-semibold">
            নতুন পাসওয়ার্ড <span className="text-red-600">*</span>
          </label>
          <div className="relative mt-1.5">
            <input
              id="invite-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={10}
              autoComplete="new-password"
              className="h-11 w-full rounded-lg border bg-background px-3.5 pr-11 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="কমপক্ষে ১০ অক্ষর"
            />
            <button
              type="button"
              onClick={() => setShow((value) => !value)}
              aria-label={show ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখান"}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary"
            >
              {show ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="invite-confirm" className="text-[13px] font-semibold">
            পাসওয়ার্ড আবার লিখুন <span className="text-red-600">*</span>
          </label>
          <input
            id="invite-confirm"
            type={show ? "text" : "password"}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            minLength={10}
            autoComplete="new-password"
            className="mt-1.5 h-11 w-full rounded-lg border bg-background px-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="একই পাসওয়ার্ড"
          />
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="mt-6 h-11 w-full bg-gold-gradient text-[15px] font-bold text-gold-foreground">
        {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
        {busy ? "চালু করা হচ্ছে…" : "অ্যাকাউন্ট চালু করুন"}
      </Button>
      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        লিংকটি একবারই ব্যবহার করা যায়। সমস্যা হলে অফিসের সঙ্গে যোগাযোগ করুন।
      </p>
    </form>
  );
}
