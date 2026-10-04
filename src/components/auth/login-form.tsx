"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Language } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email + password sign-in card with show/hide password toggle. */
export function LoginForm({ lang }: { lang: Language }) {
  const bn = lang === "bn";
  const { t } = useLanguage();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) errors.email = bn ? "সঠিক ইমেইল দিন" : "Enter a valid email";
    if (password.length < 8) errors.password = bn ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের" : "Password must be at least 8 characters";
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload: {
        data?: { user: { name: string; email: string; role: string } };
        error?: string;
        fields?: Record<string, string>;
      } = await res.json();

      if (!res.ok || !payload.data) {
        if (payload.fields) setFieldErrors(payload.fields);
        toast({
          title: payload.error ?? (bn ? "ইমেইল বা পাসওয়ার্ড সঠিক নয়" : "Invalid email or password"),
          variant: "destructive",
        });
        return;
      }

      toast({
        title: bn ? `স্বাগতম, ${payload.data.user.name}!` : `Welcome back, ${payload.data.user.name}!`,
        description: bn ? "সফলভাবে লগইন হয়েছে" : "Signed in successfully",
      });
      router.push(payload.data.user.role === "admin" ? "/admin" : "/account");
      router.refresh();
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <form
        onSubmit={onSubmit}
        noValidate
        aria-label={bn ? "লগইন ফর্ম" : "Login form"}
        className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />

        <h2 className="font-heading text-center text-xl font-semibold">
          {bn ? "অ্যাকাউন্টে লগইন করুন" : "Sign In to Your Account"}
        </h2>
        <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
          {bn
            ? "অনুদানের রিসিপ্ট ও স্পন্সর রিপোর্ট দেখতে লগইন করুন"
            : "Sign in to view donation receipts and sponsor reports"}
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">{t("label.email")} *</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p id="login-email-error" role="alert" className="text-[12px] font-medium text-destructive">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="login-password">
              {bn ? "পাসওয়ার্ড" : "Password"} *
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                minLength={8}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? (bn ? "পাসওয়ার্ড লুকান" : "Hide password") : bn ? "পাসওয়ার্ড দেখান" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="login-password-error" role="alert" className="text-[12px] font-medium text-destructive">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-primary text-[15px] font-semibold hover:bg-primary/90"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {bn ? "লগইন হচ্ছে…" : "Signing in…"}
            </>
          ) : (
            <>
              <LogIn aria-hidden className="h-4 w-4" />
              {t("action.login")}
            </>
          )}
        </Button>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          {bn ? "অ্যাকাউন্ট নেই?" : "Don't have an account?"}{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {bn ? "রেজিস্ট্রেশন করুন" : "Create one"}
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-muted-foreground">
        {bn
          ? "অ্যাকাউন্ট ছাড়াও অনুদান দিতে পারেন — সাপোর্ট পেজে শুধু নাম-ইমেইল দিলেই রিসিপ্ট পাবেন।"
          : "You can donate without an account — just provide your name and email on the support page to get a receipt."}
      </p>
    </div>
  );
}
