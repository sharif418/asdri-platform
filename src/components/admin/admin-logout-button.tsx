"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { Language } from "@/types";

/**
 * Sidebar-flavoured logout: clears the session cookie, then refreshes so the
 * admin layout guard bounces the visitor back to /login.
 */
export function AdminLogoutButton({ lang }: { lang: Language }) {
  const bn = lang === "bn";
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({ title: bn ? "সফলভাবে লগআউট হয়েছে" : "Signed out successfully" });
    } catch {
      toast({ title: bn ? "সার্ভারে সমস্যা হয়েছে" : "Something went wrong", variant: "destructive" });
    } finally {
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-[13px] font-semibold text-ivory/70 transition-colors hover:bg-gold/15 hover:text-gold disabled:opacity-60"
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="h-4 w-4" />
      )}
      {bn ? "লগআউট" : "Log out"}
    </button>
  );
}
