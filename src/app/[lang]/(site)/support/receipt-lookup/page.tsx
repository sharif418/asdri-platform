import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/shared/page-hero";
import { ReceiptLookupForm } from "@/components/donations/receipt-lookup-form";
import { alternatesFor, isLang, type Lang } from "@/lib/locale";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

interface ReceiptLookupPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: raw } = await params;
  const isBn = raw === "bn";
  const { canonical, languages } = alternatesFor("/support/receipt-lookup", env.siteUrl);
  return {
    title: isBn ? "অনুদানের অবস্থা ও রিসিপ্ট — আস-সুন্নাহ ইনস্টিটিউট" : "Donation Status & Receipt — As-Sunnah Institute",
    description: isBn
      ? "ট্র্যাকিং কোড ও মোবাইল/ইমেইল দিয়ে আপনার অনুদানের বর্তমান অবস্থা দেখুন, অপেক্ষমাণ হলে পেমেন্টের নির্দেশনা পান, সম্পন্ন হলে রিসিপ্ট প্রিন্ট করুন।"
      : "Check your donation's status with the tracking code and your phone/email, repeat the payment instructions while pending, and print the receipt once complete.",
    alternates: { canonical, languages },
  };
}

/**
 * Public donation status & receipt lookup. Donors keep the tracking code
 * (DN-…) from the confirmation; pairing it with the phone/email they used on
 * the form is what authorises the view (the API enforces the pair — codes
 * alone are sequential and must never be enough).
 */
export default async function ReceiptLookupPage({ params }: ReceiptLookupPageProps) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "সাপোর্ট করুন" : "Support Us"}
        title={lang === "bn" ? "অনুদানের অবস্থা ও রিসিপ্ট" : "Donation Status & Receipt"}
        description={
          lang === "bn"
            ? "ট্র্যাকিং কোড আর আপনার মোবাইল/ইমেইল — এই দুটি মিললেই অনুদানের অবস্থা, পেমেন্টের নির্দেশনা ও রিসিপ্ট হাতের মুঠোয়।"
            : "Your tracking code plus your phone or email brings the donation status, payment instructions, and receipt to your fingertips."
        }
        lang={lang}
        breadcrumb={[
          { label: { bn: "অনুদান ও সদকা পোর্টাল", en: "Donation Portal" }, href: "/support" },
          { label: { bn: "অবস্থা ও রিসিপ্ট", en: "Status & Receipt" } },
        ]}
        className="py-10 sm:py-14"
      />

      <section
        className="flex-1 bg-parchment py-12 sm:py-16"
        aria-label={lang === "bn" ? "অনুদানের অবস্থা খুঁজুন" : "Find donation status"}
      >
        <div className="container-site">
          <ReceiptLookupForm lang={lang} />
        </div>
      </section>
    </>
  );
}
