"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";
import { toast } from "@/hooks/use-toast";
import type { Language } from "@/types";

/** Logs the user out (clears the session cookie) and refreshes the page state. */
export function LogoutButton({ lang }: { lang: Language }) {
  const bn = lang === "bn";
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({ title: bn ? "সফলভাবে লগআউট হয়েছে" : "Signed out successfully" });
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onLogout}
      disabled={loading}
      className="gap-2 border-primary/30 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="h-4 w-4" />
      )}
      {bn ? "লগআউট" : "Log out"}
    </Button>
  );
}
