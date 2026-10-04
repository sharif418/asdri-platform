"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

/** Admin top-bar logout — destroys the session and returns to the login page. */
export function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast({ title: "সফলভাবে লগআউট হয়েছে" });
    } catch {
      toast({ title: "লগআউট করা যায়নি", variant: "destructive" });
    } finally {
      router.push("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onLogout}
      disabled={loading}
      className="gap-2 border-primary/30 font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
    >
      {loading ? (
        <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut aria-hidden className="h-4 w-4" />
      )}
      লগআউট
    </Button>
  );
}
