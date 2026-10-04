"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterRole = "student" | "donor" | "alumni";

const roleOptions: { value: RegisterRole; labelBn: string; labelEn: string }[] = [
  { value: "student", labelBn: "শিক্ষার্থী", labelEn: "Student" },
  { value: "donor", labelBn: "ডোনার", labelEn: "Donor" },
  { value: "alumni", labelBn: "অ্যালামনাই", labelEn: "Alumni" },
];

/** Password strength: 0 (too short) → 1 weak → 2 fair → 3 strong. */
function passwordStrength(pw: string): number {
  if (pw.length < 8) return 0;
  let score = 1;
  if (/[a-zA-Z]/.test(pw) && /\d/.test(pw)) score = 2;
  if (score === 2 && (/[^a-zA-Z0-9]/.test(pw) || (/[a-z]/.test(pw) && /[A-Z]/.test(pw)))) score = 3;
  return score;
}

/** Registration card: name, email, phone, role, password + strength hint + confirm. */
export function RegisterForm({ lang }: { lang: Language }) {
  const bn = lang === "bn";
  const { t } = useLanguage();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<RegisterRole>("student");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const strength = passwordStrength(password);
  const strengthMeta =
    strength === 0
      ? { bars: 0, labelBn: "কমপক্ষে ৮ অক্ষর দিন", labelEn: "At least 8 characters", tone: "bg-muted-foreground/30" }
      : strength === 1
        ? { bars: 1, labelBn: "দুর্বল পাসওয়ার্ড", labelEn: "Weak password", tone: "bg-rose-500" }
        : strength === 2
          ? { bars: 2, labelBn: "মাঝারি শক্তি", labelEn: "Fair strength", tone: "bg-amber-500" }
          : { bars: 3, labelBn: "শক্তিশালী পাসওয়ার্ড", labelEn: "Strong password", tone: "bg-emerald-600" };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    if (name.trim().length < 2) errors.name = bn ? "নাম কমপক্ষে ২ অক্ষরের হতে হবে" : "Name must be at least 2 characters";
    if (!EMAIL_RE.test(email.trim())) errors.email = bn ? "সঠিক ইমেইল দিন" : "Enter a valid email";
    if (password.length < 8) errors.password = bn ? "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের" : "Password must be at least 8 characters";
    if (password !== confirmPassword) {
      errors.confirmPassword = bn ? "পাসওয়ার্ড দুটি মিলছে না" : "Passwords do not match";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({ title: Object.values(errors)[0], variant: "destructive" });
      return;
    }

    setFieldErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          password,
          confirmPassword,
        }),
      });
      const payload: {
        data?: { user: { name: string; email: string; role: string } };
        error?: string;
        fields?: Record<string, string>;
      } = await res.json();

      if (!res.ok || !payload.data) {
        if (payload.fields) {
          setFieldErrors(payload.fields);
          toast({ title: Object.values(payload.fields)[0] ?? payload.error ?? t("toast.error"), variant: "destructive" });
        } else {
          toast({ title: payload.error ?? t("toast.error"), variant: "destructive" });
        }
        return;
      }

      toast({
        title: bn ? "স্বাগতম! অ্যাকাউন্ট তৈরি হয়েছে" : "Welcome! Your account is ready",
        description: bn
          ? "স্বয়ংক্রিয়ভাবে লগইন হয়ে গেছেন — ড্যাশবোর্ডে যাচ্ছি…"
          : "You are signed in — taking you to the dashboard…",
      });
      router.push("/account");
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
        aria-label={bn ? "রেজিস্ট্রেশন ফর্ম" : "Registration form"}
        className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-lg shadow-primary/5 sm:p-8"
      >
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gold-gradient" />

        <h2 className="font-heading text-center text-xl font-semibold">
          {bn ? "নতুন অ্যাকাউন্ট খুলুন" : "Create a New Account"}
        </h2>
        <p className="mt-1.5 text-center text-[13px] text-muted-foreground">
          {bn
            ? "শিক্ষার্থী, ডোনার ও অ্যালামনাই — সবার জন্য একটি অ্যাকাউন্ট"
            : "One account for students, donors, and alumni"}
        </p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="register-name">{t("label.name")} *</Label>
            <Input
              id="register-name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
            />
            {fieldErrors.name ? (
              <p id="register-name-error" role="alert" className="text-[12px] font-medium text-destructive">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-email">{t("label.email")} *</Label>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
            />
            {fieldErrors.email ? (
              <p id="register-email-error" role="alert" className="text-[12px] font-medium text-destructive">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="register-phone">
                {t("label.phone")}{" "}
                <span className="text-[11px] font-normal text-muted-foreground">({t("label.optional")})</span>
              </Label>
              <Input
                id="register-phone"
                dir="ltr"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-role">
                {bn ? "ভূমিকা" : "I am a"} *
              </Label>
              <Select value={role} onValueChange={(v) => setRole(v as RegisterRole)}>
                <SelectTrigger id="register-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {bn ? option.labelBn : option.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-password">{bn ? "পাসওয়ার্ড" : "Password"} *</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby="register-password-hint"
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
            {/* Strength hint */}
            <div id="register-password-hint" className="flex items-center gap-2 pt-0.5" aria-live="polite">
              <span className="flex gap-1" aria-hidden>
                {[1, 2, 3].map((bar) => (
                  <span
                    key={bar}
                    className={cn(
                      "h-1.5 w-8 rounded-full transition-colors",
                      bar <= strengthMeta.bars ? strengthMeta.tone : "bg-muted",
                    )}
                  />
                ))}
              </span>
              <span className="text-[11.5px] text-muted-foreground">
                {bn ? strengthMeta.labelBn : strengthMeta.labelEn}
                {strength >= 2 ? "" : bn ? " — অক্ষর ও সংখ্যার মিশ্রণ দিন" : " — mix letters and numbers"}
              </span>
            </div>
            {fieldErrors.password ? (
              <p role="alert" className="text-[12px] font-medium text-destructive">
                {fieldErrors.password}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="register-confirm">{bn ? "পাসওয়ার্ড আবার লিখুন" : "Confirm password"} *</Label>
            <Input
              id="register-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              dir="ltr"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={fieldErrors.confirmPassword ? "register-confirm-error" : undefined}
            />
            {fieldErrors.confirmPassword ? (
              <p id="register-confirm-error" role="alert" className="text-[12px] font-medium text-destructive">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full bg-gold-gradient text-[15px] font-bold text-gold-foreground shadow-lg shadow-gold/20 hover:opacity-95"
        >
          {submitting ? (
            <>
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              {bn ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "Creating account…"}
            </>
          ) : (
            <>
              <UserPlus aria-hidden className="h-4 w-4" />
              {t("action.register")}
            </>
          )}
        </Button>

        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          {bn ? "ইতিমধ্যেই অ্যাকাউন্ট আছে?" : "Already have an account?"}{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {t("action.login")}
          </Link>
        </p>
      </form>

      <p className="mt-4 text-center text-[12px] leading-relaxed text-muted-foreground">
        {bn
          ? "আপনার পাসওয়ার্ড এনক্রিপ্টেড (scrypt) আকারে সংরক্ষিত হয় — কেউ পড়তে পারে না।"
          : "Your password is stored encrypted (scrypt) — no one can read it."}
      </p>
    </div>
  );
}
