import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { StatusLookupForm } from "@/components/admissions/status-lookup-form";
import { alternatesFor, isLang, type Lang } from "@/lib/locale";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

interface StatusPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const isBn = raw === "bn";
  const { canonical, languages } = alternatesFor("/admissions/status", env.siteUrl);
  return {
    title: isBn ? "আবেদনের অবস্থা — আস-সুন্নাহ ইনস্টিটিউট" : "Application Status — As-Sunnah Institute",
    description: isBn
      ? "ট্র্যাকিং নম্বর ও মোবাইল নম্বর দিয়ে ভর্তি আবেদনের বর্তমান অবস্থা দেখুন — লগইন ছাড়াই, যেকোনো ডিভাইস থেকে।"
      : "Check the current stage of your admission application with your tracking and mobile numbers — no login needed.",
    alternates: { canonical, languages },
  };
}

/**
 * Public application-status lookup — serves applicants who applied through
 * the office (no online account), lost their session, or are checking from
 * someone else's device. The paired secret is the mobile number on the
 * application; the API enforces it.
 */
export default async function ApplicationStatusPage({ params }: StatusPageProps) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "ভর্তি" : "Admissions"}
        title={lang === "bn" ? "আবেদনের অবস্থা" : "Application Status"}
        description={
          lang === "bn"
            ? "ট্র্যাকিং নম্বর আর মোবাইল নম্বর দিলেই আপনার আবেদন কোন ধাপে আছে তা দেখতে পাবেন — অ্যাকাউন্ট ছাড়াই।"
            : "Your tracking number and mobile number show exactly which stage your application is at — no account needed."
        }
        lang={lang}
        breadcrumb={[
          { label: { bn: "ভর্তি প্রক্রিয়া", en: "Admission Process" }, href: "/admissions" },
          { label: { bn: "আবেদনের অবস্থা", en: "Application Status" } },
        ]}
        className="py-10 sm:py-14"
      />

      <section
        className="flex-1 bg-parchment py-12 sm:py-16"
        aria-label={lang === "bn" ? "আবেদনের অবস্থা খুঁজুন" : "Find application status"}
      >
        <div className="container-site">
          <StatusLookupForm lang={lang} />
        </div>
      </section>
    </>
  );
}
