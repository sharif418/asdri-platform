import Link from "next/link";
import { BookMarked, Briefcase, GraduationCap, Hash, MapPin, Newspaper, ScrollText } from "lucide-react";
import { GoldRule } from "@/components/shared/ornaments";
import { toBnDigits } from "@/lib/format";
import { ALUMNI_COURSE_LABELS } from "@/lib/alumni";
import { AlumniContactForm } from "@/components/portal/alumni-contact-form";

type AlumniSelfProfile = {
  id: string;
  registryNo: string;
  userId: string | null;
  nameBn: string;
  nameEn: string;
  courseKey: string;
  batchYear: number;
  batchNoBn: string;
  occupationBn: string;
  organizationBn: string;
  districtBn: string;
  phone: string;
  email: string;
  addressBn: string;
  isPublished: boolean;
};

/**
 * Alumni portal home (v2, round-9 restore): the keepsake registry card — the
 * same card language as the guardian/teacher/donor/student portals (gold
 * spine, avatar initial, gold meta grid) — plus the self-service contact
 * form, then the institute's public life cards.
 */
export function AlumniHome({ self }: { self: AlumniSelfProfile | null }) {
  return (
    <div className="grid gap-8">
      {self ? <AlumniKeepsakeCard profile={self} /> : <UnlinkedNote />}

      {self ? (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Briefcase aria-hidden className="h-5 w-5 text-gold" />
            আপনার সর্বশেষ তথ্য জানান
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            বর্তমান পেশা, প্রতিষ্ঠান ও যোগাযোগের তথ্য হালনাগাদ রাখুন — অ্যালামনাই নেটওয়ার্ক ও দাওয়াহর
            কার্যক্রমে আপনাকে সঠিক ঠিকানায় পাওয়া যাবে ইনশাআল্লাহ।
          </p>
          <GoldRule className="my-4" />
          <AlumniContactForm
            initial={{
              phone: self.phone,
              email: self.email,
              addressBn: self.addressBn,
              occupationBn: self.occupationBn,
              organizationBn: self.organizationBn,
              districtBn: self.districtBn,
            }}
          />
        </section>
      ) : null}

      <section>
        <h2 className="text-lg font-bold">ইনস্টিটিউটের জীবন</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-3">
          <Link
            href="/notices"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
          >
            <Newspaper aria-hidden className="h-6 w-6 text-gold" />
            <h3 className="mt-3 text-[15.5px] font-bold group-hover:text-primary">নোটিশ বোর্ড</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">ইনস্টিটিউটের সর্বশেষ ঘোষণা ও কার্যক্রম</p>
          </Link>
          <Link
            href="/research/publications"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
          >
            <BookMarked aria-hidden className="h-6 w-6 text-gold" />
            <h3 className="mt-3 text-[15.5px] font-bold group-hover:text-primary">প্রকাশনা</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">জার্নাল, গবেষণা পত্রিকা ও অন্যান্য প্রকাশনা</p>
          </Link>
          <Link
            href="/research/library"
            className="group rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
          >
            <ScrollText aria-hidden className="h-6 w-6 text-gold" />
            <h3 className="mt-3 text-[15.5px] font-bold group-hover:text-primary">লাইব্রেরি</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">ডিজিটাল ক্যাটালগ ও পাঠ</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

/** The registry keepsake — the alumnus's own card, office data + their edits. */
function AlumniKeepsakeCard({ profile }: { profile: AlumniSelfProfile }) {
  const courseLabel = ALUMNI_COURSE_LABELS[profile.courseKey]?.bn ?? profile.courseKey;
  return (
    <section className="relative overflow-hidden rounded-2xl border bg-card p-5 pt-6 shadow-sm sm:p-6 sm:pt-7">
      {/* gold spine */}
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gold-gradient" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/[0.08] text-xl font-bold text-primary"
          >
            {profile.nameBn.trim().charAt(0) || "প"}
          </span>
          <div>
            <h2 className="text-lg font-bold leading-snug">{profile.nameBn}</h2>
            <p className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-gold/30 bg-gold/[0.06] px-2 py-0.5 text-[11px] font-semibold text-gold-foreground dark:text-gold">
                প্রাক্তন শিক্ষার্থী
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {courseLabel}
              </span>
              {profile.isPublished ? (
                <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  ডিরেক্টরিতে তালিকাভুক্ত
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <p className="font-mono text-[13px] font-bold tracking-wide text-gold-foreground dark:text-gold" dir="ltr">
          {profile.registryNo}
        </p>
      </div>

      <dl className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <GraduationCap aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">ব্যাচ</dt>
            <dd className="mt-0.5 text-[13.5px] font-semibold">
              {toBnDigits(profile.batchYear)}
              {profile.batchNoBn ? ` — ${profile.batchNoBn}` : ""}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Briefcase aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">বর্তমান পেশা</dt>
            <dd className="mt-0.5 text-[13.5px] font-semibold leading-snug">{profile.occupationBn || "—"}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">জেলা</dt>
            <dd className="mt-0.5 text-[13.5px] font-semibold">{profile.districtBn || "—"}</dd>
          </div>
        </div>
      </dl>

      {profile.organizationBn ? (
        <p className="mt-3.5 rounded-lg bg-secondary/50 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">প্রতিষ্ঠান:</span> {profile.organizationBn}
        </p>
      ) : null}
    </section>
  );
}

/** The honest note when the office hasn't linked this account to a registry row. */
function UnlinkedNote() {
  return (
    <div className="rounded-2xl border border-dashed border-gold/40 bg-card px-6 py-10 text-center">
      <Hash aria-hidden className="mx-auto h-8 w-8 text-gold" />
      <h2 className="mt-3 text-lg font-bold">আপনার রেকর্ডটি এখনো যুক্ত হয়নি</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        অফিসে আপনার অ্যালামনাই রেকর্ড এই ইমেইল দিয়ে যুক্ত হলে এখানে আপনার রেজিস্ট্রি কার্ড দেখা যাবে।
        ভর্তি অফিসে আপনার ইমেইল জানিয়ে রাখুন।
      </p>
    </div>
  );
}
