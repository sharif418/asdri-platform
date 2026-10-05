import sanitizeHtml from "sanitize-html";

/**
 * Rich-text sanitisation — the office writes Bangla prose in the admin
 * editor; we persist a strict whitelist of semantic HTML. Everything else
 * (scripts, styles, iframes, event handlers, unknown tags) is stripped
 * before storage, so stored HTML is safe to render.
 */

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s",
    "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote",
    "a",
    "hr",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: "a",
      attribs: { ...attribs, rel: "noopener noreferrer nofollow" },
    }),
    b: () => ({ tagName: "strong", attribs: {} }),
    i: () => ({ tagName: "em", attribs: {} }),
  },
  disallowedTagsMode: "discard",
};

/** Sanitise editor HTML for storage. Empty/whitespace-only input → "". */
export function sanitizeRichText(html: string): string {
  const clean = sanitizeHtml(html ?? "", OPTIONS);
  const stripped = clean.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  return stripped.length === 0 ? "" : clean;
}

/** Client-side preview sanitisation (same rules, safe for untrusted input). */
export function sanitizeRichTextPreview(html: string): string {
  return sanitizeRichText(html);
}

/* ————————————— HTML → display text ————————————— */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  lsquo: "\u2018",
  rsquo: "\u2019",
  ldquo: "\u201C",
  rdquo: "\u201D",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string): string => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const value = Number.parseInt(code.slice(2), 16);
      return Number.isFinite(value) && value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match;
    }
    if (code.startsWith("#")) {
      const value = Number.parseInt(code.slice(1), 10);
      return Number.isFinite(value) && value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/**
 * Stored rich HTML → plain display text: block-level closers become
 * newlines (the fatwa wire DTO renders answers as text paragraphs), inline
 * tags are dropped, entities are resolved. Plain text passes through
 * unchanged apart from entity decoding.
 */
export function richTextToPlain(html: string): string {
  const withBreaks = (html ?? "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*(p|li|h[2-4]|blockquote)\s*>/gi, "\n")
    .replace(/<\s*(hr|ul|ol)\s*[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeEntities(withBreaks)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
