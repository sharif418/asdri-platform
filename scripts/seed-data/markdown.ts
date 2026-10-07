/**
 * Minimal markdown → HTML for seed post bodies (round 4, M9).
 *
 * The editorial source (src/content/blog.ts) writes article bodies as
 * markdown — "##" headings, **bold**, "- " lists, blank-line paragraphs.
 * The admin RTE and the public article page both render HTML, so the seed
 * converts once, here: no runtime markdown dependency, no new packages.
 *
 * Rules (deliberately small — this converts known seed prose, not user input):
 *   - "## X" → <h2>, "### X" → <h3>, "#### X" → <h4>
 *   - "**X**" → <strong>X</strong>; "*X*" → <em>X</em> (single-asterisk
 *     pairs only — a lone literal asterisk is left alone)
 *   - consecutive "- " lines → one <ul> with <li> per line
 *   - other non-empty lines accumulate into a blank-line-delimited <p>
 *   - & < > are escaped in text content
 *
 * Already-HTML input (first non-space character "<") passes through
 * unchanged, which keeps re-seeds and the mixed news/clarification sources
 * idempotent.
 */

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Inline marks (bold, emphasis) on top of escaped text. Emphasis needs
 * non-space content hugging the asterisks (the CommonMark rule) — so
 * literal "২ * ৩ = ৬" stays as written. */
function inline(md: string): string {
  return escapeHtml(md)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^\w*])\*(\S(?:[^*]*\S)?)\*(?!\*)/g, "$1<em>$2</em>");
}

export function mdToHtml(md: string): string {
  const input = md.trim();
  if (input.startsWith("<")) return md;

  const out: string[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      out.push(`<p>${inline(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length > 0) {
      out.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  for (const raw of input.split("\n")) {
    const line = raw.trim();
    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{2,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return out.join("\n");
}
