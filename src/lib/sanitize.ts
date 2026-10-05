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
