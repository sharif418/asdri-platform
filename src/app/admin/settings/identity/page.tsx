import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getSession, roleCan } from "@/lib/auth";
import {
  getSiteIdentity,
  getSiteContact,
  getSiteSocial,
  getSitePayment,
  getZakatConfig,
} from "@/lib/settings";
import { SettingsForms } from "@/components/admin/settings-forms";

export const metadata = { title: "পরিচিতি ও যোগাযোগ" };

/** Identity / contact / social / payment / zakat settings editor (typed forms per key). */
export default async function AdminSettingsIdentityPage() {
  const session = await getSession();
  if (!session || !roleCan(session.user.role, "settings.manage")) redirect("/admin");

  const [identity, contact, social, payment, zakat] = await Promise.all([
    getSiteIdentity(),
    getSiteContact(),
    getSiteSocial(),
    getSitePayment(),
    getZakatConfig(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <a href="/admin/settings" className="hover:text-primary hover:underline">
          সাইট সেটিংস
        </a>
        <span aria-hidden>›</span>
        <span>পরিচিতি ও যোগাযোগ</span>
      </div>
      <h1 className="font-heading mt-1 flex items-center gap-2 text-2xl font-bold">
        <Building2 aria-hidden className="h-6 w-6 text-primary" />
        পরিচিতি ও যোগাযোগ
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        হেডার, ফুটার, যোগাযোগ পেজ, অনুদান চ্যানেল ও যাকাত ক্যালকুলেটর — সব এই মানগুলো থেকে চলে।
      </p>

      <div className="mt-6">
        <SettingsForms identity={identity} contact={contact} social={social} payment={payment} zakat={zakat} />
      </div>
    </div>
  );
}
