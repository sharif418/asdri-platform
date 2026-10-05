"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "ADMISSIONS" | "FINANCE" | "FATWA" | "APPLICANT";
  isActive: boolean;
  lastLoginAt: string | null;
  isSelf: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "অ্যাডমিন",
  EDITOR: "সম্পাদক",
  ADMISSIONS: "ভর্তি কর্মকর্তা",
  FINANCE: "আর্থিক কর্মকর্তা",
  FATWA: "ফতোয়া বিভাগ",
  APPLICANT: "আবেদনকারী",
};

const STAFF_ROLES = ["ADMIN", "EDITOR", "ADMISSIONS", "FINANCE", "FATWA"] as const;

function csrfToken(): string {
  return document.cookie.match(/asr-csrf=([^;]+)/)?.[1] ?? "";
}

/** One-time password reveal — shown once, copyable, dismissable. */
function PasswordReveal({ password, onDismiss }: { password: string; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-gold/50 bg-gold/10 p-4">
      <p className="text-[12.5px] font-bold text-gold">এই পাসওয়ার্ডটি আর কখনো দেখানো হবে না — এখনই কপি করে রাখুন</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <code className="rounded-lg bg-card px-3 py-2 text-sm font-bold" dir="ltr">
          {password}
        </code>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(password).then(
              () => toast({ title: "কপি হয়েছে" }),
              () => toast({ title: "কপি করা যায়নি — হাতে লিখে নিন", variant: "destructive" }),
            );
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-2.5 py-1.5 text-[12px] font-semibold hover:bg-secondary"
        >
          <Copy aria-hidden className="h-3.5 w-3.5" />
          কপি
        </button>
        <button type="button" onClick={onDismiss} className="text-[12px] font-semibold text-muted-foreground hover:text-foreground">
          সম্পন্ন
        </button>
      </div>
    </div>
  );
}

/** User & role management — create (password shown once), patch, reset, delete. */
export function UsersManager({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<UserRow[]>(users);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<(typeof STAFF_ROLES)[number]>("EDITOR");
  const [creating, setCreating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [resetPasswordFor, setResetPasswordFor] = useState<{ name: string; password: string } | null>(null);

  async function createUser() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim(), role: newRole }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; fields?: Record<string, string>; data?: { password: string } };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "ইউজার তৈরি করা যায়নি", variant: "destructive" });
        return;
      }
      setGenerated(json.data.password);
      setNewName("");
      setNewEmail("");
      setNewRole("EDITOR");
      toast({ title: "নতুন ইউজার তৈরি হয়েছে" });
      router.refresh();
    } catch {
      toast({ title: "নেটওয়ার্ক সমস্যা — আবার চেষ্টা করুন", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function patchUser(row: UserRow, patch: Partial<Pick<UserRow, "role" | "isActive">>) {
    if (busyId) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken() },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        toast({ title: json.error ?? "পরিবর্তন করা যায়নি", variant: "destructive" });
        router.refresh();
        return;
      }
      setRows((list) => list.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
      toast({ title: "সংরক্ষিত হয়েছে" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(row: UserRow) {
    if (busyId) return;
    if (!window.confirm(`${row.name} এর পাসওয়ার্ড নতুন করে তৈরি হবে — তার সব সেশন বাতিল হয়ে যাবে। নিশ্চিত?`)) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/users/${row.id}/reset-password`, {
        method: "POST",
        headers: { "x-csrf-token": csrfToken() },
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { password: string } };
      if (!res.ok || !json.ok || !json.data) {
        toast({ title: json.error ?? "পাসওয়ার্ড রিসেট করা যায়নি", variant: "destructive" });
        return;
      }
      setResetPasswordFor({ name: row.name, password: json.data.password });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(row: UserRow) {
    if (busyId) return;
    if (!window.confirm(`${row.name} (${row.email}) অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলা হবে। নিশ্চিত?`)) return;
    setBusyId(row.id);
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, { method: "DELETE", headers: { "x-csrf-token": csrfToken() } });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        toast({ title: json?.error ?? "মুছে ফেলা যায়নি", variant: "destructive" });
        return;
      }
      setRows((list) => list.filter((r) => r.id !== row.id));
      toast({ title: "অ্যাকাউন্ট মুছে ফেলা হয়েছে" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="font-heading flex items-center gap-2 text-base font-bold">
          <UserPlus aria-hidden className="h-4 w-4 text-primary" />
          নতুন ইউজার তৈরি করুন
        </h2>
        <p className="mt-1 text-[11.5px] text-muted-foreground">
          পাসওয়ার্ড স্বয়ংক্রিয়ভাবে তৈরি হয় ও একবারই দেখানো হবে — নতুন সদস্যকে হস্তান্তর করুন।
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="পুরো নাম"
            aria-label="নতুন ইউজারের নাম"
            className="min-w-40 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@assunnahinstitute.org"
            type="email"
            dir="ltr"
            aria-label="নতুন ইউজারের ইমেইল"
            className="min-w-52 flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as (typeof STAFF_ROLES)[number])}
            aria-label="নতুন ইউজারের রোল"
            className="rounded-lg border bg-background px-3 py-2 text-sm"
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void createUser()}
            disabled={creating || !newName.trim() || !newEmail.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : <Plus aria-hidden className="h-4 w-4" />}
            তৈরি করুন
          </button>
        </div>

        {generated && <div className="mt-4">{<PasswordReveal password={generated} onDismiss={() => setGenerated(null)} />}</div>}
      </section>

      {resetPasswordFor && (
        <PasswordReveal
          password={resetPasswordFor.password}
          onDismiss={() => setResetPasswordFor(null)}
        />
      )}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-secondary/30 px-4 py-2.5">
          <p className="text-[12.5px] font-semibold text-muted-foreground">
            মোট {formatNumber(rows.length, "bn")} টি অ্যাকাউন্ট · নিজের অ্যাকাউন্ট নিষ্ক্রিয় বা মুছে ফেলা যায় না
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[11.5px] uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-semibold">নাম</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell">শেষ লগইন</th>
              <th className="px-4 py-3 font-semibold">রোল</th>
              <th className="px-4 py-3 font-semibold">সক্রিয়</th>
              <th className="px-4 py-3 text-right font-semibold">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className={cn("transition-colors hover:bg-secondary/20", row.isSelf && "bg-gold/5")}>
                <td className="px-4 py-3">
                  <p className="font-medium">
                    {row.name}
                    {row.isSelf && <span className="ml-1.5 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">আপনি</span>}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground" dir="ltr">
                    {row.email}
                  </p>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="text-[12px] text-muted-foreground">
                    {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString("bn-BD") : "কখনো নয়"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.role}
                    disabled={busyId === row.id || row.isSelf}
                    onChange={(e) => void patchUser(row, { role: e.target.value as UserRow["role"] })}
                    aria-label={`${row.name} — রোল`}
                    className="rounded-lg border bg-background px-2.5 py-1.5 text-[12.5px] disabled:opacity-60"
                  >
                    {Object.keys(ROLE_LABELS).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Switch
                    checked={row.isActive}
                    disabled={busyId === row.id || row.isSelf}
                    onCheckedChange={(v) => void patchUser(row, { isActive: v })}
                    aria-label={`${row.name} — সক্রিয়`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => void resetPassword(row)}
                      disabled={busyId === row.id}
                      title="পাসওয়ার্ড রিসেট"
                      aria-label={`${row.name} — পাসওয়ার্ড রিসেট`}
                      className="inline-flex items-center rounded-lg border px-2 py-1.5 text-muted-foreground hover:bg-secondary disabled:opacity-40"
                    >
                      {busyId === row.id ? <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> : <KeyRound aria-hidden className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeUser(row)}
                      disabled={busyId === row.id || row.isSelf}
                      title={row.isSelf ? "নিজের অ্যাকাউন্ট মুছে ফেলা যাবে না" : "অ্যাকাউন্ট মুছে ফেলুন"}
                      aria-label={`${row.name} — মুছে ফেলুন`}
                      className="inline-flex items-center rounded-lg border border-destructive/30 px-2 py-1.5 text-destructive hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
