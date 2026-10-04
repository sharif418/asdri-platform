"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Facebook, Mail, MapPin, Phone, Send, Youtube } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InstituteLogo } from "@/components/shared/logo";
import { StarMotif } from "@/components/shared/ornaments";
import { useLanguage } from "@/components/providers/language-provider";
import { navigation, siteConfig } from "@/content/site";
import { langPath } from "@/lib/locale";
import type { DictionaryKey } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface FooterColumn {
  titleKey: DictionaryKey;
  links: { key: DictionaryKey; href: string }[];
}

const footerColumns: FooterColumn[] = [
  {
    titleKey: "footer.quickLinks",
    links: [
      { key: "nav.academics.courses", href: "/academics/courses" },
      { key: "nav.admissions.process", href: "/admissions" },
      { key: "nav.about.alumni", href: "/about/alumni" },
      { key: "nav.media.blog", href: "/media/blog" },
      ...navigation.notices.slice(0, 2),
      ...navigation.support.slice(0, 2),
    ],
  },
  {
    titleKey: "footer.resources",
    links: [
      { key: "nav.academics.downloads", href: "/academics/downloads" },
      { key: "nav.research.library", href: "/research/library" },
      { key: "nav.research.fatwa", href: "/research/fatwa" },
      { key: "nav.support.calculator", href: "/support/zakat-calculator" },
    ],
  },
];

/** Newsletter subscribe form (client island inside the footer). */
function NewsletterForm() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload: { data?: { message: string }; error?: string } = await res.json();
      if (!res.ok) throw new Error(payload.error ?? "error");
      toast({
        title: t("toast.success"),
        description: payload.data?.message ?? "",
      });
      setEmail("");
    } catch {
      toast({ title: t("toast.error"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex gap-2" aria-label={t("form.newsletterTitle")}>
      <label htmlFor="footer-newsletter" className="sr-only">
        {t("label.email")}
      </label>
      <Input
        id="footer-newsletter"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("label.email")}
        className="h-11 border-ivory/25 bg-white/10 text-ivory placeholder:text-ivory/50 focus-visible:ring-gold"
      />
      <Button
        type="submit"
        disabled={loading}
        className="h-11 shrink-0 bg-gold-gradient px-4 text-gold-foreground hover:opacity-95"
      >
        <Send aria-hidden className="h-4 w-4" />
        <span className="sr-only">{t("action.submit")}</span>
      </Button>
    </form>
  );
}

/** Site footer — deep emerald ground, gold accents, 4-column grid. */
export function SiteFooter() {
  const { t, lang } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden bg-emerald-deep text-ivory/85">
      <div aria-hidden className="pattern-lattice-light absolute inset-0 opacity-60" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-gold-gradient" />

      <div className="container-site relative grid gap-12 py-14 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-12 lg:py-16">
        {/* Brand + about */}
        <div>
          <div className="flex items-center gap-3">
            <InstituteLogo tone="on-dark" className="h-12 w-12" />
            <div>
              <p className="font-heading text-[15px] font-semibold leading-snug text-ivory">
                {lang === "bn" ? siteConfig.shortBn : siteConfig.nameEn}
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-gold">
                {lang === "bn" ? siteConfig.nameEn : siteConfig.shortEn}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-ivory/70">
            {lang === "bn" ? siteConfig.taglineBn : siteConfig.taglineEn}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href={siteConfig.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-gold hover:text-gold"
            >
              <Facebook aria-hidden className="h-4.5 w-4.5" />
            </a>
            <a
              href={siteConfig.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-gold hover:text-gold"
            >
              <Youtube aria-hidden className="h-4.5 w-4.5" />
            </a>
            <a
              href={siteConfig.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-gold hover:text-gold"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-4.5 w-4.5">
                <path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 0 1 7 2.9 9.83 9.83 0 0 1 2.89 7c0 5.45-4.44 9.87-9.9 9.87zM20.5 3.49A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.33 11.89-11.89 0-3.18-1.24-6.16-3.44-8.42z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Link columns */}
        {footerColumns.map((column) => (
          <nav key={column.titleKey} aria-label={t(column.titleKey)}>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
              <StarMotif className="h-3 w-3" />
              {t(column.titleKey)}
            </h3>
            <ul className="mt-3">
              {column.links.map((link) => (
                <li key={link.href + link.key}>
                  <Link
                    href={langPath(lang, link.href)}
                    className="flex min-h-11 items-center text-sm text-ivory/75 transition-colors hover:text-gold"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Contact + newsletter */}
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold">
            <StarMotif className="h-3 w-3" />
            {t("footer.contactInfo")}
          </h3>
          <ul className="mt-3 space-y-1 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin aria-hidden className="mt-3.5 h-4 w-4 shrink-0 text-gold" />
              <span className="min-h-11 py-2 leading-relaxed">{lang === "bn" ? siteConfig.addressBn : siteConfig.addressEn}</span>
            </li>
            <li>
              <a
                href={siteConfig.phoneHref}
                className="flex min-h-11 items-center gap-2.5 transition-colors hover:text-gold"
              >
                <Phone aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                <span dir="ltr">{siteConfig.phone}</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${siteConfig.email}`}
                className="flex min-h-11 items-center gap-2.5 transition-colors hover:text-gold"
              >
                <Mail aria-hidden className="h-4 w-4 shrink-0 text-gold" />
                {siteConfig.email}
              </a>
            </li>
          </ul>

          <h3
            id="newsletter"
            className="mt-9 flex scroll-mt-6 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gold"
          >
            <StarMotif className="h-3 w-3" />
            {t("form.newsletterTitle")}
          </h3>
          <p className="mt-3 text-sm text-ivory/70">{t("form.newsletterDesc")}</p>
          <NewsletterForm />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-ivory/10">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-6 text-center text-[13px] text-ivory/60 sm:flex-row sm:text-left">
          <p>
            © {lang === "bn" ? "২০২৫" : "2025"}
            {year > 2025 ? `–${lang === "bn" ? "২০" + String(year).slice(2) : year}` : ""}{" "}
            {siteConfig.nameEn} — {t("footer.rights")}
          </p>
          <p className="flex items-center gap-2">
            <StarMotif className="h-3 w-3 text-gold/60" />
            {t("footer.developedBy")}
          </p>
        </div>
      </div>
    </footer>
  );
}
