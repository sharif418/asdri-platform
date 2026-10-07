"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, UserRound } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { langPath } from "@/lib/locale";
import { cn } from "@/lib/utils";

interface MeUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const STAFF_ROLES = ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"];

/**
 * The account area of the main bar — a client island so the public pages
 * around it stay cacheable. Anonymous visitors get the login affordance;
 * signed-in visitors get their chip linking to /account (or /admin for
 * staff), with their initial as the avatar.
 */
export function AccountChip({ className }: { className?: string }) {
  const { lang, t } = useLanguage();
  const [user, setUser] = useState<MeUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) setUser((json as { user?: MeUser } | null)?.user ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) {
    // reserve the chip's width — no layout shift when the session resolves
    return (
      <span
        aria-hidden
        className={cn("inline-flex h-10 w-10 items-center justify-center sm:w-[86px]", className)}
      />
    );
  }

  if (!user) {
    return (
      <Link
        href={langPath(lang, "/login")}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3 text-[12.5px] font-semibold text-foreground transition-colors hover:border-gold hover:text-primary",
          className,
        )}
      >
        <LogIn aria-hidden className="h-4 w-4 text-primary" />
        <span className="hidden sm:inline">{t("action.login")}</span>
      </Link>
    );
  }

  const isStaff = STAFF_ROLES.includes(user.role);
  return (
    <Link
      href={isStaff ? "/admin" : langPath(lang, "/account")}
      className={cn(
        "group inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card pl-1 pr-3 transition-colors hover:border-gold",
        className,
      )}
      title={user.email}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-primary-foreground">
        {user.name.trim().charAt(0) || "অ"}
      </span>
      <span className="hidden max-w-[120px] truncate text-[12.5px] font-semibold sm:inline">
        {user.name}
      </span>
    </Link>
  );
}
