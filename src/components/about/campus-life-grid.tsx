import {
  Award,
  BookOpenCheck,
  MapPinned,
  MessagesSquare,
  Presentation,
  Volleyball,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, Stagger, RevealItem } from "@/components/shared/reveal";
import { campusLifeItems } from "@/content/faculty";
import { pick } from "@/types";
import type { Language } from "@/types";

const lifeIcons: Record<string, LucideIcon> = {
  "messages-square": MessagesSquare,
  presentation: Presentation,
  "book-open-check": BookOpenCheck,
  "map-pinned": MapPinned,
  volleyball: Volleyball,
  award: Award,
};

/** Image-led grid of campus-life highlights. */
export function CampusLifeGrid({ lang }: { lang: Language }) {
  return (
    <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {campusLifeItems.map((item) => {
        const Icon = lifeIcons[item.icon] ?? BookOpenCheck;
        return (
          <RevealItem key={item.id}>
            <article className="group h-full overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10">
              <div className="relative aspect-[16/10] overflow-hidden bg-emerald-deep/10">
                <img
                  src={item.image}
                  alt={pick(item.title, lang)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-emerald-deep/60 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-emerald-deep/90 px-3 py-1.5 text-xs font-medium text-ivory backdrop-blur-sm">
                  <Icon aria-hidden className="h-3.5 w-3.5 text-gold" />
                  {pick(item.title, lang)}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-heading text-base font-semibold leading-snug">{pick(item.title, lang)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {pick(item.description, lang)}
                </p>
              </div>
            </article>
          </RevealItem>
        );
      })}
    </Stagger>
  );
}
