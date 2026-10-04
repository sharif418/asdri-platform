import { isValidElement, type ReactNode } from "react";

/**
 * Article content helpers: markdown heading extraction for tables of
 * contents (with stable, deduplicated anchor ids shared between the
 * server-side TOC list and the react-markdown heading renderers) and
 * Bengali reading-time estimation.
 */

/** Bangla-script reading pace — words per minute (Bengali prose average). */
const BANGLA_WPM = 180;

export interface TocHeading {
  /** Stable DOM anchor id (also produced by ArticleProse heading renderers). */
  id: string;
  /** Plain heading text (inline markdown stripped). */
  text: string;
  /** Heading level — only h2/h3 participate in the TOC. */
  level: 2 | 3;
}

/** Strip inline markdown (links, emphasis, code markers) from heading text. */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]+/g, "")
    .trim();
}

/**
 * URL-safe, readable slug for a (possibly Bengali) heading.
 * Bengali letters, marks (dependent vowel signs) and digits are
 * preserved — HTML ids allow them and browsers resolve `#বাংলা`
 * fragments natively.
 */
function headingSlug(text: string): string {
  const slug = text
    .trim()
    .replace(/[\s\u200c\u200d]+/g, "-")
    .replace(/[^\p{L}\p{M}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug.length > 0 ? slug : "অংশ";
}

/**
 * Factory for a document-order heading-id resolver with duplicate
 * suffixes (`heading`, `heading-2`, …). Both `extractHeadings` and the
 * ArticleProse renderers must consume the SAME resolver algorithm so
 * anchor ids always line up.
 */
function createHeadingIdResolver(): (text: string) => string {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = headingSlug(stripInlineMarkdown(text));
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

/** Extract h2/h3 headings from markdown, in document order. */
export function extractHeadings(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const resolveId = createHeadingIdResolver();
  const pattern = /^(#{2,3})[ \t]+(.+?)[ \t]*$/gm;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(markdown)) !== null) {
    const level: 2 | 3 = match[1].length === 2 ? 2 : 3;
    const text = stripInlineMarkdown(match[2]);
    headings.push({ id: resolveId(match[2]), text, level });
  }
  return headings;
}

/** Heading-id resolver for react-markdown custom renderers (per render pass). */
export { createHeadingIdResolver };

/** Plain text from a rendered ReactNode (string | number | element tree). */
export function nodeToText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeToText(node.props.children);
  }
  return "";
}

/**
 * Estimated reading minutes for (primarily Bengali) article content at
 * ~180 wpm. Markdown and HTML markup are stripped before counting so
 * only real words are measured.
 */
export function estimateReadingMinutes(content: string): number {
  const plain = content
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`~>|]+/g, " ");
  const words = plain.split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word));
  return Math.max(1, Math.ceil(words.length / BANGLA_WPM));
}
