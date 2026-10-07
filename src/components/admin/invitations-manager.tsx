"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, MailPlus, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminConfirm } from "@/components/admin/ui/confirm";
import { toast } from "@/hooks/use-toast";
import { ROLE_LABELS_BN, ROLE_HINTS_BN } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface InvitationRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  courseLabel: string | null;
  note: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expiresAt: string;
  createdAt: string;
}

interface CourseOption {
  id: string;
  label: string;
}

const INVITABLE: { role: UserRole; label: string }[] = (
  ["EDITOR", "ADMISSIONS", "FINANCE", "FATWA", "LIBRARIAN", "TEACHER", "STUDENT", "GUARDIAN", "DONOR", "ALUMNI"] as UserRole[]
).map((role) => ({ role, label: ROLE_LABELS_BN[role] }));

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

const STATUS_META: Record<InvitationRow["status"], { label: string; chip: string }> = {
  pending: { label: "অপেক্ষমাণ", chip: "bg-gold/15 text-gold" },
  accepted: { label: "গৃহীত", chip: "bg-primary/10 text-primary" },
  expired: { label: "মেয়াদ শেষ", chip: "bg-muted text-muted-foreground" },
  revoked: { label: "বাতিল", chip: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
};

/**
 * Invitation management — how every office-controlled account begins.
 * Create (e-mail queued automatically), copy the link for WhatsApp/phone,
 * revoke a pending invite. The invitee sets their own password at the link.
 */
export function InvitationsManager({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<InvitationRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "GUARDIAN" as UserRole, courseId: "", note: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin/invitations", { cache: "no-store" });
    const json = (await res.json()) as { ok?: boolean; invitations?: InvitationRow[] };
    setRows(json.invitations ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    if (busy) return;
    setBusy(true);
    setFieldErrors({});
    try {
      const res = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          role: form.role,
          courseId: form.role === "TEACHER" && form.courseId ? form.courseId : null,
          note: form.note || undefined,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        fields?: Record<string, string>;
        invitation?: { linkPath: string };
      };
      if (!res.ok || !json.ok) {
        setFieldErrors(json.fields ?? {});
        toast({ title: json.error ?? "আমন্ত্রণ তৈরি করা যায়নি", variant: "destructive" });
        return;
      }
      toast({ title: "আমন্ত্রণ তৈরি হয়েছে — ইমেইল পাঠানো হয়েছে" });
      if (json.invitation) setLastLink(`${window.location.origin}${json.invitation.linkPath}`);
      setForm({ name: "", email: "", role: "GUARDIAN", courseId: "", note: "" });
      setOpen(false);
      await load();
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function revoke(row: InvitationRow) {
    const yes = await adminConfirm({
      title: `${row.name} (${row.email}) এর আমন্ত্রণটি বাতিল করবেন?`,
      description: "লিংকটি আর কাজ করবে না। প্রয়োজনে নতুন আমন্ত্রণ তৈরি করতে হবে।",
    });
    if (!yes) return;
    const res = await fetch(`/api/admin/invitations/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
      body: JSON.stringify({ action: "revoke" }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) {
      toast({ title: json.error ?? "বাতিল করা যায়নি", variant: "destructive" });
      return;
    }
    toast({ title: "আমন্ত্রণ বাতিল হয়েছে" });
    await load();
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(link);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "কপি করা যায়নি — লিংকটি ম্যানুয়ালি কপি করুন" });
    }
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">আমন্ত্রণ ব্যবস্থাপনা</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            স্টাফ ও পোর্টাল অ্যাকাউন্ট তৈরি হয় আমন্ত্রণে — সদস্য নিজেই পাসওয়ার্ড দেন।
          </p>
        </div>
        <Button type="button" onClick={() => setOpen((v) => !v)} className="gap-2">
          <MailPlus aria-hidden className="h-4 w-4" />
          নতুন আমন্ত্রণ
        </Button>
      </div>

      {lastLink ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold-soft/30 px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-[12.5px] font-medium" dir="ltr">
            {lastLink}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={() => void copyLink(lastLink)} className="gap-1.5">
            {copied === lastLink ? <Check aria-hidden className="h-3.5 w-3.5" /> : <Copy aria-hidden className="h-3.5 w-3.5" />}
            {copied === lastLink ? "কপি হয়েছে" : "লিংক কপি করুন"}
          </Button>
        </div>
      ) : null}

      {open ? (
        <div className="mt-4 grid gap-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="invite-name" className="text-[13px] font-semibold">
                নাম <span className="text-red-600">*</span>
              </label>
              <input
                id="invite-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 h-11 w-full rounded-lg border bg-background px-3.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="সদস্যের পূর্ণ নাম"
              />
              {fieldErrors.name ? <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{fieldErrors.name}</p> : null}
            </div>
            <div>
              <label htmlFor="invite-email" className="text-[13px] font-semibold">
                ইমেইল <span className="text-red-600">*</span>
              </label>
              <input
                id="invite-email"
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 h-11 w-full rounded-lg border bg-background px-3.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="member@example.com"
              />
              {fieldErrors.email ? <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{fieldErrors.email}</p> : null}
            </div>
            <div>
              <label htmlFor="invite-role" className="text-[13px] font-semibold">
                রোল <span className="text-red-600">*</span>
              </label>
              <select
                id="invite-role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="mt-1.5 h-11 w-full rounded-lg border bg-background px-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {INVITABLE.map((option) => (
                  <option key={option.role} value={option.role}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[12px] text-muted-foreground" aria-live="polite">
                {ROLE_HINTS_BN[form.role]}
              </p>
            </div>
            {form.role === "TEACHER" ? (
              <div>
                <label htmlFor="invite-course" className="text-[13px] font-semibold">
                  কোর্স <span className="text-red-600">*</span>
                </label>
                <select
                  id="invite-course"
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="mt-1.5 h-11 w-full rounded-lg border bg-background px-3 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— বাছাই করুন —</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.courseId ? <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">{fieldErrors.courseId}</p> : null}
              </div>
            ) : null}
          </div>
          <div>
            <label htmlFor="invite-note" className="text-[13px] font-semibold">
              নোট (ঐচ্ছিক)
            </label>
            <input
              id="invite-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="mt-1.5 h-11 w-full rounded-lg border bg-background px-3.5 text-[14.5px] focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="যেমন: ২০২৬ ব্যাচের অভিভাবক"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              বন্ধ করুন
            </Button>
            <Button type="button" onClick={() => void create()} disabled={busy} className="gap-2">
              {busy ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Send aria-hidden className="h-4 w-4" />}
              আমন্ত্রণ পাঠান
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-sm">
        {rows === null ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">লোড হচ্ছে…</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            এখনো কোনো আমন্ত্রণ পাঠানো হয়নি — প্রথমটি তৈরি করুন।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="bg-secondary/50 text-[11.5px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">সদস্য</th>
                  <th className="px-4 py-3 font-semibold">রোল</th>
                  <th className="px-4 py-3 font-semibold">অবস্থা</th>
                  <th className="px-4 py-3 font-semibold">মেয়াদ</th>
                  <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-[11.5px] text-muted-foreground" dir="ltr">
                        {row.email}
                      </p>
                      {row.courseLabel ? <p className="text-[11.5px] text-gold">{row.courseLabel}</p> : null}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.roleLabel}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold", STATUS_META[row.status].chip)}>
                        {STATUS_META[row.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted-foreground">
                      {new Date(row.expiresAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.status === "pending" ? (
                        <Button type="button" size="sm" variant="ghost" onClick={() => void revoke(row)} className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30">
                          <XCircle aria-hidden className="h-4 w-4" />
                          বাতিল
                        </Button>
                      ) : (
                        <span className="text-[11.5px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
