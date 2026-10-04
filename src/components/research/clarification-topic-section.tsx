import Link from "next/link";
import { ArrowUpRight, FileText, FlaskConical, Globe, HelpCircle, Landmark, Play, ShieldAlert, Venus } from "lucide-react";
import { toBnDigits } from "@/lib/format";
import { langPath } from "@/lib/locale";
import { pick } from "@/types";
import type { BlogArticle, ClarificationTopic, Language } from "@/types";

const topicIcons: Record<string, typeof FlaskConical> = {
  "flask-conical": FlaskConical,
  landmark: Landmark,
  "help-circle": HelpCircle,
  venus: Venus,
  globe: Globe,
  "shield-alert": ShieldAlert,
};

/**
 * One clarification topic section. Renders with an explicit
 * `id="topic-{id}"` anchor — the home page deep-links here.
 */
export function ClarificationTopicSection({
  topic,
  index,
  lang,
  related,
}: {
  topic: ClarificationTopic;
  index: number;
  lang: Language;
  /** DB-driven related articles for the topic, passed by the server page. */
  related: BlogArticle[];
}) {
  const Icon = topicIcons[topic.icon] ?? HelpCircle;
  const flip = index % 2 === 1;

  return (
    <article
      id={`topic-${topic.id}`}
      className="scroll-mt-28 rounded-3xl border bg-card p-6 shadow-sm sm:p-9"
    >
      <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
        {/* identity column */}
        <div className={`lg:col-span-2 ${flip ? "lg:order-2" : ""}`}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-deep text-gold">
              <Icon aria-hidden className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
                {lang === "bn" ? `খাত ${index + 1}` : `Track ${index + 1}`}
              </p>
              <h2 className="font-heading text-xl font-semibold sm:text-2xl">{pick(topic.title, lang)}</h2>
            </div>
          </div>

          <p className="mt-5 text-sm leading-[1.9] text-muted-foreground">{pick(topic.description, lang)}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold">
              <FileText aria-hidden className="h-3.5 w-3.5" />
              {lang === "bn" ? `${toBnDigits(topic.articleCount)} টি আর্টিকেল` : `${topic.articleCount} articles`}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Play aria-hidden className="h-3.5 w-3.5" />
              {lang === "bn" ? `${toBnDigits(topic.videoCount)} টি ভিডিও` : `${topic.videoCount} videos`}
            </span>
          </div>

          <p className="mt-5 rounded-xl border border-dashed bg-parchment p-3.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {lang === "bn"
              ? "প্রতিটি বিষয়ে আর্টিকেল, ভিডিও ও ডাউনলোডযোগ্য পিডিএফ — তিন ফরম্যাটে প্রস্তুত জবাব সংরক্ষণ করা হয়।"
              : "Every topic maintains responses in three formats — article, video, and downloadable PDF."}
          </p>
        </div>

        {/* related articles column */}
        <div className={`lg:col-span-3 ${flip ? "lg:order-1" : ""}`}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {lang === "bn" ? "সম্পর্কিত আর্টিকেল" : "Related Articles"}
          </h3>
          <ul className="mt-4 space-y-3">
            {related.map((article) => (
              <li key={article.slug}>
                <Link
                  href={langPath(lang, `/media/blog/${article.slug}`)}
                  className="group flex items-start justify-between gap-4 rounded-xl border bg-background/60 p-4 transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-sm"
                >
                  <div>
                    <h4 className="text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
                      {pick(article.title, lang)}
                    </h4>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                      {pick(article.excerpt, lang)}
                    </p>
                    <p className="mt-2 text-[11px] font-medium text-primary/80">— {article.author}</p>
                  </div>
                  <ArrowUpRight
                    aria-hidden
                    className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gold"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={langPath(lang, "/media/blog")}
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-colors hover:text-gold"
          >
            {lang === "bn" ? "সব আর্টিকেল দেখুন" : "Browse all articles"}
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
