import { cn } from "@/lib/utils";
import type { LocalizedText } from "@/types";
import { pick } from "@/types";
import type { Language } from "@/types";

interface SectionHeadingProps {
  eyebrow?: LocalizedText | string;
  title: LocalizedText | string;
  description?: LocalizedText | string;
  lang: Language;
  align?: "left" | "center";
  tone?: "default" | "on-dark";
  className?: string;
  as?: "h1" | "h2" | "h3";
}

function resolveText(text: LocalizedText | string | undefined, lang: Language): string | undefined {
  if (!text) return undefined;
  return typeof text === "string" ? text : pick(text, lang);
}

/**
 * The canonical section heading used across every page:
 * gold eyebrow with rules → large serif title → muted description.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  lang,
  align = "center",
  tone = "default",
  className,
  as: Tag = "h2",
}: SectionHeadingProps) {
  const eyebrowText = resolveText(eyebrow, lang);
  const titleText = resolveText(title, lang);
  const descText = resolveText(description, lang);

  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrowText ? (
        <div
          className={cn(
            "mb-4 flex items-center gap-3",
            align === "center" && "justify-center",
          )}
        >
          <span aria-hidden className="h-px w-8 bg-gold/70" />
          <span
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.25em]",
              tone === "on-dark" ? "text-gold" : "text-gold",
            )}
          >
            {eyebrowText}
          </span>
          <span aria-hidden className="h-px w-8 bg-gold/70" />
        </div>
      ) : null}
      <Tag
        className={cn(
          "font-heading text-balance text-3xl font-semibold leading-tight sm:text-4xl",
          tone === "on-dark" ? "text-ivory" : "text-foreground",
        )}
      >
        {titleText}
      </Tag>
      {descText ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            tone === "on-dark" ? "text-ivory/75" : "text-muted-foreground",
          )}
        >
          {descText}
        </p>
      ) : null}
    </div>
  );
}
