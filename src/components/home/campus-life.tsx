import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { getCampusLifeItems } from "@/lib/content/admission";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { Language } from "@/types";

/** Campus life & student development — visual grid. */
export async function CampusLife({ lang }: { lang: Language }) {
  const campusLifeItems = await getCampusLifeItems();
  return (
    <section className="py-16 sm:py-24">
      <div className="container-site">
        <Reveal>
          <SectionHeading
            eyebrow={lang === "bn" ? "ক্যাম্পাস লাইফ" : "Campus Life"}
            title={lang === "bn" ? "ক্যাম্পাস জীবন ও শিক্ষার্থী উন্নয়ন" : "Campus Life & Student Development"}
            description={
              lang === "bn"
                ? "একটি আদর্শ ইসলামী পরিবেশে শিক্ষার্থীদের মেধা ও মনন বিকাশে আমাদের ক্যাম্পাস লাইফ অত্যন্ত প্রাণবন্ত।"
                : "A vibrant campus life nurturing students' intellect and character in an ideal Islamic environment."
            }
            lang={lang}
          />
        </Reveal>

        <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {campusLifeItems.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                lang={lang}
                subject={{ bn: "ক্যাম্পাস লাইফ কার্যক্রম", en: "campus life items" }}
              />
            </div>
          ) : null}
          {campusLifeItems.map((item) => (
            <RevealItem key={item.id}>
              <article className="group relative h-full overflow-hidden rounded-xl shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/15">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={pick(item.title, lang)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-emerald-deep/95 via-emerald-deep/25 to-transparent" />
                  <h3 className="font-heading absolute bottom-3 left-4 right-4 text-[15px] font-semibold text-ivory">
                    {pick(item.title, lang)}
                  </h3>
                </div>
                <div className="border-t-2 border-gold/70 bg-card p-4">
                  <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
                    {pick(item.description, lang)}
                  </p>
                </div>
              </article>
            </RevealItem>
          ))}
        </Stagger>

        <Reveal className="mt-10 text-center">
          <Link
            href={langPath(lang, "/about/campus")}
            className="link-sweep inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            {lang === "bn" ? "ক্যাম্পাস ও সুবিধাসমূহ" : "Campus & Facilities"}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
