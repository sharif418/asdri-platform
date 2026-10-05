import { redirect } from "next/navigation";

/** Section root — the inbox desk lives in its first tab. */
export default function AdminInboxPage() {
  redirect("/admin/inbox/messages");
}
