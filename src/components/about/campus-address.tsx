import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/shared/reveal";
import { siteConfig } from "@/content/site";
import { pick } from "@/types";
import type { LocalizedText } from "@/types";

interface CampusAddressProps {
  title: LocalizedText;
  description: LocalizedText;
  lang: "bn" | "en";
}

/** Residential campus address card + embedded map. */
export function CampusAddress({ title, description, lang }: CampusAddressProps) {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container-site">
        <div className="grid items-stretch gap-8 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <article className="relative h-full overflow-hidden rounded-xl bg-emerald-deep p-8 text-ivory shadow-lg">
              <div aria-hidden className="pattern-lattice-light absolute inset-0" />
              <div className="relative">
                <h2 className="font-heading text-2xl font-semibold leading-snug">{pick(title, lang)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ivory/75">{pick(description, lang)}</p>

                <address className="mt-6 space-y-4 not-italic">
                  <p className="flex items-start gap-3 text-sm">
                    <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <span>{lang === "bn" ? siteConfig.addressBn : siteConfig.addressEn}</span>
                  </p>
                  <p className="flex items-center gap-3 text-sm">
                    <Phone aria-hidden className="h-5 w-5 shrink-0 text-gold" />
                    <a href={siteConfig.phoneHref} className="transition-colors hover:text-gold">
                      {siteConfig.phone}
                    </a>
                  </p>
                  <p className="flex items-center gap-3 text-sm">
                    <Mail aria-hidden className="h-5 w-5 shrink-0 text-gold" />
                    <a href={`mailto:${siteConfig.email}`} className="transition-colors hover:text-gold">
                      {siteConfig.email}
                    </a>
                  </p>
                  <p className="flex items-start gap-3 text-sm">
                    <Clock3 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                    <span>{lang === "bn" ? siteConfig.hoursBn : siteConfig.hoursEn}</span>
                  </p>
                </address>

                <Button
                  asChild
                  className="bg-gold-gradient font-semibold text-gold-foreground shadow-md hover:opacity-95"
                >
                  <a href={siteConfig.mapsLink} target="_blank" rel="noopener noreferrer">
                    <MapPin aria-hidden className="h-4 w-4" />
                    {lang === "bn" ? "গুগল ম্যাপে দেখুন" : "View on Google Maps"}
                  </a>
                </Button>
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-3">
            <div className="h-full min-h-[320px] overflow-hidden rounded-xl border shadow-sm">
              <iframe
                src={siteConfig.mapsEmbed}
                title={lang === "bn" ? "ক্যাম্পাস অবস্থান মানচিত্র" : "Campus location map"}
                className="h-full min-h-[320px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
