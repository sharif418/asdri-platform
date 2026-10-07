import type { Metadata } from "next";
import { db } from "@/lib/db";
import type { Lang } from "@/lib/locale";
import { alternatesFor, langPath } from "@/lib/locale";
import { env } from "@/lib/env";
import { isFeatureEnabled, getAboutContent, readSetting } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { PageHero } from "@/components/shared/page-hero";
import { ModuleUnavailable } from "@/components/shared/module-unavailable";
import { ApplicationForm, type IntakeOption } from "@/components/admissions/application-form";
import { ClipboardList } from "lucide-react";
import { getAdmissionSteps } from "@/lib/content/admission";

export async function generateMetadata({ params }: { params: Promise<{ lang: Lang }> }): Promise<Metadata> {
  const { lang } = await params;
  const { canonical, languages } = alternatesFor("/admissions/apply", env.siteUrl);
  return {
    title: lang === "bn" ? "অনলাইন আবেদন" : "Online Application",
    description:
      lang === "bn"
        ? "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউটে অনলাইনে ভর্তি আবেদন — ব্যক্তিগত তথ্য, শিক্ষাগত যোগ্যতা ও ডকুমেন্ট সংযুক্তি সহ।"
        : "Apply online to the As-Sunnah Dawah & Research Institute — personal details, education, and document uploads.",
    alternates: { canonical, languages },
  };
}

/** The online application — the form that replaces Facebook admissions. */
export default async function ApplyPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;

  if (!(await isFeatureEnabled("admissions"))) {
    return <ModuleUnavailable lang={lang} moduleLabelBn="অনলাইন আবেদন" moduleLabelEn="Online applications" icon={ClipboardList} />;
  }

  const [intakeRows, session, admission] = await Promise.all([
    db.intake.findMany({
      where: { isPublished: true, status: "OPEN" },
      orderBy: { closesAt: "asc" },
      include: { course: { select: { code: true, titleBn: true, titleEn: true } } },
    }),
    getSession(),
    getAboutContent(),
  ]);
  void admission;
  void getAdmissionSteps;

  const intakes: IntakeOption[] = intakeRows.map((intake) => ({
    id: intake.id,
    courseCode: intake.course.code,
    labelBn: `${intake.course.titleBn} — ${intake.sessionBn || `${intake.year}`}`,
    labelEn: `${intake.course.titleEn} — ${intake.sessionEn || `${intake.year}`}`,
    seatsTotal: intake.seatsTotal,
    closesAt: intake.closesAt?.toISOString() ?? null,
    examDate: intake.examDate?.toISOString() ?? null,
    examTimeBn: intake.examTimeBn,
    examVenueBn: intake.examVenueBn,
  }));

  // Declaration copy is office-editable (/admin/content/admission); the
  // static text is only the fallback for a never-saved setting.
  const admissionCopy = await readSetting<{
    declarationBn: string;
    declarationEn: string;
    applyIntroBn: string;
    applyIntroEn: string;
  }>("admissions.settings", {
    declarationBn:
      "আমি ঘোষণা করছি যে, আমি প্রদত্ত সকল তথ্য সঠিক ও নির্ভুল। কোনো তথ্য মিথ্যা প্রমাণিত হলে আমার আবেদন বাতিল বলে গণ্য হবে।",
    declarationEn:
      "I declare that all information provided is true and correct. If any information proves false, my application will be considered cancelled.",
    applyIntroBn: "",
    applyIntroEn: "",
  });
  const declarationBn = admissionCopy.declarationBn;
  const declarationEn = admissionCopy.declarationEn;
  const applyIntro = lang === "bn" ? admissionCopy.applyIntroBn : admissionCopy.applyIntroEn;

  return (
    <>
      <PageHero
        eyebrow={lang === "bn" ? "ভর্তি" : "Admissions"}
        title={lang === "bn" ? "অনলাইন ভর্তি আবেদন" : "Online Admission Application"}
        description={
          lang === "bn"
            ? "অফিসিয়াল ওয়েবসাইটেই এখন আবেদন — ফেসবুকের ফর্মের সব ধাপ, সংযুক্তি আপলোডসহ। জমা দেওয়ার পর ট্র্যাকিং নম্বর পাবেন এবং আপনার অ্যাকাউন্ট থেকে আবেদনের অবস্থা দেখতে পারবেন।"
            : "Apply on the official website — every step of the previous Facebook flow, with document uploads. You will receive a tracking number and can follow the status from your account."
        }
        breadcrumb={[
          { label: lang === "bn" ? "হোম" : "Home", href: langPath(lang, "/") },
          { label: lang === "bn" ? "ভর্তি" : "Admissions", href: langPath(lang, "/admissions") },
          { label: lang === "bn" ? "আবেদন" : "Apply" },
        ]}
        lang={lang}
      />
      <div className="container-site pb-16 sm:pb-24">
        {applyIntro ? (
          <p className="mx-auto mb-6 max-w-3xl rounded-xl border border-gold/30 bg-gold-soft/30 p-4 text-[13.5px] leading-relaxed text-foreground/90">
            {applyIntro}
          </p>
        ) : null}
        <ApplicationForm
          intakes={intakes}
          loggedIn={Boolean(session)}
          declarationBn={declarationBn}
          declarationEn={declarationEn}
          lang={lang}
        />
      </div>
    </>
  );
}
