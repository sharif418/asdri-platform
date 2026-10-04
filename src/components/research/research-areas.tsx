import { FlaskConical, Globe, HelpCircle, Landmark, ShieldAlert, Venus } from "lucide-react";
import { clarificationTopics } from "@/content/research";
import { pick } from "@/types";
import type { Language } from "@/types";

const topicIcons: Record<string, typeof FlaskConical> = {
  "flask-conical": FlaskConical,
  landmark: Landmark,
  "help-circle": HelpCircle,
  venus: Venus,
  globe: Globe,
  "shield-alert": ShieldAlert,
};

/** Research areas grid — the intellectual fronts the institute works on. */
export function ResearchAreas({ lang }: { lang: Language }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clarificationTopics.map((topic) => {
        const Icon = topicIcons[topic.icon] ?? HelpCircle;
        return (
          <article
            key={topic.id}
            className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 text-gold">
                <Icon aria-hidden className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-emerald-deep/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                {lang === "bn" ? "গবেষণা খাত" : "Research Track"}
              </span>
            </div>
            <h3 className="font-heading mt-4 text-base font-semibold">{pick(topic.title, lang)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pick(topic.description, lang)}</p>
          </article>
        );
      })}
    </div>
  );
}
