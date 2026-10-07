import Link from "next/link";
import { Mail, Search } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, roleCan } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MessagesList, type MessageRow } from "@/components/admin/messages-list";
import { AdminPager } from "@/components/admin/admin-pager";

export const metadata = { title: "যোগাযোগ বার্তা" };

const PAGE_SIZE = 50;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Contact-message inbox — read/unread, expandable view, mark-all-read. */
export default async function AdminInboxMessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "messages.read")) redirect("/admin");

  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 120);
  const unreadOnly = sp.filter === "unread";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const where = {
    ...(unreadOnly ? { isRead: false } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q, mode: "insensitive" as const } }, { subject: { contains: q } }, { message: { contains: q } }] } : {}),
  };

  const [total, messages] = await Promise.all([
    db.contactMessage.count({ where }),
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, phone: true, subject: true, message: true, isRead: true, createdAt: true },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rows: MessageRow[] = messages.map((message) => ({
    id: message.id,
    name: message.name,
    email: message.email,
    phone: message.phone ?? "",
    subject: message.subject,
    message: message.message,
    isRead: message.isRead,
    createdAt: message.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-muted-foreground">
        <Link href="/admin/inbox/messages" className="hover:text-primary">বার্তা ও সাবস্ক্রাইবার</Link>
        <span aria-hidden className="mx-1.5">/</span>
        <span className="text-foreground">যোগাযোগ বার্তা</span>
      </nav>
      <h1 className="font-heading mt-2 flex items-center gap-2 text-2xl font-bold">
        <Mail aria-hidden className="h-6 w-6 text-primary" />
        যোগাযোগ বার্তা
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        ওয়েবসাইটের যোগাযোগ ফর্ম থেকে আসা বার্তা — পড়া হলে বোতাম চাপুন, সাইডবারের ব্যাজ আপডেট হবে।
      </p>

      <form className="mt-6 flex flex-wrap gap-2" action="/admin/inbox/messages" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="নাম, ইমেইল বা বিষয় দিয়ে খুঁজুন…"
          className="min-w-52 flex-1 rounded-lg border bg-card px-3.5 py-2 text-sm outline-none focus:border-primary/50"
        />
        <select name="filter" defaultValue={unreadOnly ? "unread" : ""} className="rounded-lg border bg-card px-3 py-2 text-sm">
          <option value="">সব বার্তা</option>
          <option value="unread">শুধু অপঠিত</option>
        </select>
        <button type="submit" className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold hover:bg-secondary">
          <Search aria-hidden className="mr-1 inline h-3.5 w-3.5" />
          ফিল্টার
        </button>
      </form>

      <div className="mt-4">
        <MessagesList key={rows.map((row) => `${row.id}:${row.isRead}`).join("|")} messages={rows} />
      </div>

      <AdminPager
        page={page}
        pageCount={pageCount}
        total={total}
        unit="বার্তা"
        buildHref={(next) => `/admin/inbox/messages?${new URLSearchParams({ ...(q ? { q } : {}), ...(unreadOnly ? { filter: "unread" } : {}), page: String(next) }).toString()}`}
      />
    </div>
  );
}
