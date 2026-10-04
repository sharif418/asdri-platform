import Markdown, { type Components } from "react-markdown";
import { StarMotif } from "@/components/shared/ornaments";
import { createHeadingIdResolver, nodeToText } from "@/lib/article";

/**
 * Renders Bengali/English article markdown with the `.prose-islamic`
 * design system (globals.css) plus premium custom renderers:
 * serif headings with gold markers and stable anchor ids (matched by
 * the article TOC), justified paragraphs, diamond-bulleted lists,
 * and gold-accented blockquotes.
 */
export function ArticleProse({ content }: { content: string }) {
  // Document-order heading ids — must mirror extractHeadings() ids.
  const resolveHeadingId = createHeadingIdResolver();

  const components: Components = {
    h2: ({ children }) => (
      <h2 id={resolveHeadingId(nodeToText(children))} className="scroll-mt-11">
        <span aria-hidden className="mr-2 inline-block h-2 w-2 rotate-45 bg-gold align-middle" />
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 id={resolveHeadingId(nodeToText(children))} className="scroll-mt-11">
        <span aria-hidden className="mr-2 text-gold">✦</span>
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote>
        <span aria-hidden className="absolute right-4 top-3 opacity-30">
          <StarMotif className="h-6 w-6 text-gold" />
        </span>
        {children}
      </blockquote>
    ),
    hr: () => (
      <div className="flex items-center justify-center gap-3" aria-hidden>
        <span className="h-px w-16 bg-gold/50" />
        <StarMotif className="h-3 w-3 text-gold/80" />
        <span className="h-px w-16 bg-gold/50" />
      </div>
    ),
  };

  return (
    <div className="prose-islamic">
      <Markdown components={components}>{content}</Markdown>
    </div>
  );
}
