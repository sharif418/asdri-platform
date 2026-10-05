import { redirect } from "next/navigation";

/**
 * Section root for বার্তা ও সাবস্ক্রাইবার — no index view of its own; jump
 * straight to the first management page (contact messages).
 */
export default function AdminInboxIndexPage() {
  redirect("/admin/inbox/messages");
}
