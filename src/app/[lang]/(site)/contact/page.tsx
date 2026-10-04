import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Clock3,
  ExternalLink,
  Facebook,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Twitter,
  Youtube,
} from "lucide-react";
import { langPath, type Lang } from "@/lib/locale";
import { pick } from "@/types";
import { siteConfig } from "@/content/site";
import { PageHero } from "@/components/shared/page-hero";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { ContactForm } from "@/components/contact/contact-form";
import { GoldRule, StarMotif } from "@/components/shared/ornaments";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "যোগাযোগ ও ঠিকানা | আস-সুন্নাহ ইনস্টিটিউট",
  description:
    "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট, সাঁতারকুল, বাড্ডা, ঢাকা — ফোন, ইমেইল, অফিস সময়সূচি, লোকেশন ম্যাপ ও যোগাযোগ ফরম।",
};

interface InfoCard {
  id: string;
  icon: typeof Phone;
  label: string;
  lines: string[];
  href?: string;
  hrefLabel?: string;
}

interface SocialLink {
  id: string;
  name: string;
  handle: string;
  href: string;
  icon: typeof Facebook;
  className: string;
}

export default async function ContactPage({ params }: { params: Promise<{ lang: Lang }> }) {
  const { lang } = await params;
  const bn = lang === "bn";

  const infoCards: InfoCard[] = [
    {
      id: "phone",
      icon: Phone,
      label: bn ? "ফোন / হোয়াটসঅ্যাপ" : "Phone / WhatsApp",
      lines: [siteConfig.phone],
      href: siteConfig.phoneHref,
      hrefLabel: bn ? "এখনই কল করুন" : "Call now",
    },
    {
      id: "hours",
      icon: Clock3,
      label: bn ? "অফিস সময়সূচি" : "Office Hours",
      lines: [bn ? siteConfig.hoursBn : siteConfig.hoursEn, bn ? "শুক্রবার সাপ্তাহিক বন্ধ" : "Friday weekly off"],
    },
    {
      id: "address",
      icon: MapPin,
      label: bn ? "ঠিকানা" : "Address",
      lines: [bn ? siteConfig.addressBn : siteConfig.addressEn],
      href: siteConfig.mapsLink,
      hrefLabel: bn ? "ম্যাপে দেখুন" : "View on map",
    },
    {
      id: "email",
      icon: Mail,
      label: bn ? "ইমেইল" : "Email",
      lines: [siteConfig.email],
      href: `mailto:${siteConfig.email}`,
      hrefLabel: bn ? "ইমেইল পাঠান" : "Send email",
    },
  ];

  const departments: { id: string; name: string; email: string }[] = [
    {
      id: "admission",
      name: bn ? "ভর্তি বিভাগ" : "Admission Office",
      email: siteConfig.emailAdmission,
    },
    {
      id: "info",
      name: bn ? "সাধারণ তথ্য" : "General Information",
      email: siteConfig.email,
    },
    {
      id: "dawah",
      name: bn ? "দাওয়াহ ও গবেষণা" : "Dawah & Research",
      email: siteConfig.email,
    },
  ];

  const socials: SocialLink[] = [
    {
      id: "facebook",
      name: "Facebook",
      handle: "facebook.com/assunnahfoundation",
      href: siteConfig.socials.facebook,
      icon: Facebook,
      className: "hover:border-[#1877F2]/60 hover:bg-[#1877F2]/5",
    },
    {
      id: "youtube",
      name: "YouTube",
      handle: "@AsSunnahFoundation",
      href: siteConfig.socials.youtube,
      icon: Youtube,
      className: "hover:border-destructive/50 hover:bg-destructive/5",
    },
    {
      id: "x",
      name: bn ? "এক্স (টুইটার)" : "X (Twitter)",
      handle: "@assunnahinfo",
      href: siteConfig.socials.twitter,
      icon: Twitter,
      className: "hover:border-foreground/40 hover:bg-muted",
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      handle: siteConfig.phone,
      href: siteConfig.socials.whatsapp,
      icon: MessageCircle,
      className: "hover:border-[#25D366]/60 hover:bg-[#25D366]/5",
    },
  ];

  return (
    <>
      <PageHero
        lang={lang}
        eyebrow={{ bn: "আমাদের সঙ্গে যুক্ত হোন", en: "Get in Touch" }}
        title={{ bn: "যোগাযোগ ও ঠিকানা", en: "Contact & Location" }}
        description={{
          bn: "ভর্তি, গবেষণা সহযোগিতা কিংবা সাধারণ জিজ্ঞাসা — যেকোনো বিষয়ে আমাদের জানান। আমরা দ্রুত সাড়া দিই।",
          en: "Admissions, research collaboration, or general queries — reach out about anything. We respond quickly.",
        }}
        breadcrumb={[{ label: { bn: "যোগাযোগ", en: "Contact" } }]}
        arabicEcho="وَأَصْلِحْ ذَاتَ بَيْنِكُمْ"
      />

      {/* ————— Info cards ————— */}
      <section className="bg-parchment py-14 sm:py-20" aria-label={bn ? "যোগাযোগের তথ্য" : "Contact information"}>
        <div className="container-site">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {infoCards.map((card) => {
              const Icon = card.icon;
              const content = (
                <>
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                  {card.lines.map((line, index) => (
                    <p key={index} className="mt-1.5 text-sm font-semibold leading-relaxed">
                      {line}
                    </p>
                  ))}
                  {card.href && card.hrefLabel ? (
                    <span className="link-sweep mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-primary dark:text-gold">
                      {card.hrefLabel}
                      <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                    </span>
                  ) : null}
                </>
              );
              return (
                <RevealItem key={card.id}>
                  {card.href ? (
                    <a
                      href={card.href}
                      target={card.href.startsWith("http") ? "_blank" : undefined}
                      rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="group block h-full rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-md"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="group h-full rounded-2xl border bg-card p-5 shadow-sm">{content}</div>
                  )}
                </RevealItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ————— Form + map ————— */}
      <section className="py-14 sm:py-20" aria-label={bn ? "যোগাযোগ ফরম ও লোকেশন" : "Contact form & location"}>
        <div className="container-site grid gap-8 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <h2 className="font-heading text-xl font-semibold sm:text-2xl">
                {bn ? "আমাদের মাধ্যমে যোগাযোগ করুন" : "Get in Touch"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {bn
                  ? "নিচের ফরমটি পূরণ করুন — ইনস্টিটিউট অফিস থেকে কর্মদিবসে ২৪–৪৮ ঘণ্টার মধ্যে উত্তর দেওয়া হয়।"
                  : "Fill the form below — the institute office replies within 24–48 hours on working days."}
              </p>
              <div className="mt-6">
                <ContactForm lang={lang} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="flex flex-col gap-4">
            <div className="relative flex-1 overflow-hidden rounded-2xl border shadow-sm">
              <iframe
                src={siteConfig.mapsEmbed}
                title={bn ? "আস-সুন্নাহ ইনস্টিটিউট লোকেশন ম্যাপ" : "As-Sunnah Institute location map"}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[300px] w-full border-0"
              />
            </div>
            <a
              href={siteConfig.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between rounded-2xl border bg-emerald-deep px-5 py-4 text-ivory shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <MapPin aria-hidden className="h-5 w-5 text-gold" />
                <div>
                  <p className="text-sm font-semibold">
                    {bn ? "গুগল ম্যাপে নির্দেশনা নিন" : "Get directions on Google Maps"}
                  </p>
                  <p className="text-xs text-ivory/70">{bn ? siteConfig.addressBn : siteConfig.addressEn}</p>
                </div>
              </div>
              <ExternalLink aria-hidden className="h-4 w-4 text-gold transition-transform group-hover:translate-x-0.5" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ————— Department emails + socials ————— */}
      <section className="bg-parchment py-14 sm:py-20" aria-label={bn ? "বিভাগীয় ইমেইল ও সোশ্যাল মিডিয়া" : "Departments & social media"}>
        <div className="container-site grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-heading text-xl font-semibold sm:text-2xl">
              {bn ? "বিভাগভিত্তিক ইমেইল" : "Department Emails"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {bn
                ? "নির্দিষ্ট বিভাগে সরাসরি ইমেইল করলে দ্রুত সমাধান পাবেন।"
                : "Emailing the right department gets you a faster answer."}
            </p>
            <ul className="mt-6 space-y-3">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <a
                    href={`mailto:${dept.email}`}
                    className="group flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-gold/50 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Mail aria-hidden className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{dept.name}</span>
                      <span className="block truncate text-[13px] text-muted-foreground">{dept.email}</span>
                    </span>
                    <Send aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary dark:group-hover:text-gold" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="font-heading text-xl font-semibold sm:text-2xl">
              {bn ? "সোশ্যাল মিডিয়ায় অনুসরণ করুন" : "Follow Us"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {bn
                ? "নতুন নোটিশ, ভিডিও ও প্রবন্ধের ঘোষণা সবার আগে পেতে অনুসরণ করুন।"
                : "Be the first to hear about new notices, videos, and essays."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.id}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                      social.className,
                    )}
                  >
                    <Icon aria-hidden className="h-5 w-5 text-primary dark:text-gold" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{social.name}</span>
                      <span className="block truncate text-[12px] text-muted-foreground">{social.handle}</span>
                    </span>
                  </a>
                );
              })}
            </div>

            {/* FAQ teaser */}
            <Link
              href={langPath(lang, "/admissions/faq")}
              className="group mt-6 flex items-center gap-4 rounded-xl border border-gold/40 bg-gold/10 p-4 transition-all hover:bg-gold/20"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold-gradient text-gold-foreground">
                <HelpCircle aria-hidden className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">
                  {bn ? "সাধারণ জিজ্ঞাসা (FAQ)" : "Frequently Asked Questions"}
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  {bn
                    ? "ভর্তি, বৃত্তি ও কোর্স সংক্রান্ত প্রশ্নের উত্তর আগেই দেখে নিন"
                    : "Check answers about admissions, scholarships, and courses first"}
                </span>
              </span>
              <ArrowRight aria-hidden className="h-4 w-4 text-gold transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ————— Other websites ————— */}
      <section id="other-sites" className="scroll-mt-24 py-14 sm:py-20" aria-labelledby="other-sites-heading">
        <div className="container-site">
          <Reveal>
            <div className="mb-8 flex items-center gap-3">
              <span aria-hidden className="h-px flex-1 bg-gold/40" />
              <h2 id="other-sites-heading" className="font-heading text-2xl font-semibold sm:text-3xl">
                {bn ? "অন্যান্য ওয়েবসাইট" : "Other Websites"}
              </h2>
              <span aria-hidden className="h-px flex-1 bg-gold/40" />
            </div>
          </Reveal>

          <Stagger className="grid gap-5 md:grid-cols-3">
            <RevealItem>
              <a
                href="https://assunnahfoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-emerald-deep p-6 text-ivory shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <StarMotif aria-hidden className="absolute -right-4 -top-4 h-20 w-20 text-gold/15" />
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Globe aria-hidden className="h-6 w-6" />
                </span>
                <span className="font-heading text-lg font-semibold">
                  {bn ? "আস-সুন্নাহ ফাউন্ডেশন" : "As-Sunnah Foundation"}
                </span>
                <span className="mt-1.5 text-[13px] leading-relaxed text-ivory/70">
                  {bn
                    ? "মূল ফাউন্ডেশনের অফিসিয়াল ওয়েবসাইট — খুতবা, প্রকাশনা ও কার্যক্রম।"
                    : "The parent foundation's official website — khutbah, publications, and activities."}
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-gold">
                  assunnahfoundation.org
                  <ExternalLink aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </RevealItem>

            <RevealItem>
              <a
                href={siteConfig.socials.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Youtube aria-hidden className="h-6 w-6" />
                </span>
                <span className="font-heading text-lg font-semibold">
                  {bn ? "ইউটিউব চ্যানেল" : "YouTube Channel"}
                </span>
                <span className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {bn
                    ? "জুমার খুতবা, লেকচার সিরিজ ও সংক্ষিপ্ত সংশয় নিরসন ভিডিও।"
                    : "Friday khutbah, lecture series, and short doubt-resolution videos."}
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary dark:text-gold">
                  @AsSunnahFoundation
                  <ExternalLink aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </RevealItem>

            <RevealItem>
              <a
                href={siteConfig.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-lg"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Facebook aria-hidden className="h-6 w-6" />
                </span>
                <span className="font-heading text-lg font-semibold">
                  {bn ? "ফেসবুক পেজ" : "Facebook Page"}
                </span>
                <span className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {bn
                    ? "দৈনন্দিন আপডেট, নোটিশ ও লাইভ সেশনের ঘোষণা।"
                    : "Daily updates, notices, and live session announcements."}
                </span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary dark:text-gold">
                  facebook.com/assunnahfoundation
                  <ExternalLink aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </a>
            </RevealItem>
          </Stagger>

          <GoldRule className="mt-14" />
        </div>
      </section>
    </>
  );
}
