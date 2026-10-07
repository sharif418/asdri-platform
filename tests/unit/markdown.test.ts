import { describe, expect, test } from "bun:test";
import { mdToHtml } from "../../scripts/seed-data/markdown";

/**
 * Round 4, M9 pin: seeded post bodies are stored as HTML. The seed-time
 * markdown converter (scripts/seed-data/markdown.ts) is the only thing
 * standing between the editorial markdown source (src/content/blog.ts) and
 * the RTE/public renderer — these tests pin its grammar and its
 * pass-through-idempotence for already-HTML bodies.
 */

describe("mdToHtml (seed post bodies)", () => {
  test("headings become h2/h3/h4", () => {
    expect(mdToHtml("## শিরোনাম")).toBe("<h2>শিরোনাম</h2>");
    expect(mdToHtml("### উপশিরোনাম")).toBe("<h3>উপশিরোনাম</h3>");
    expect(mdToHtml("#### খোদ শিরোনাম")).toBe("<h4>খোদ শিরোনাম</h4>");
  });

  test("blank-line separated lines become paragraphs", () => {
    expect(mdToHtml("প্রথম অনুচ্ছেদ\n\nদ্বিতীয় অনুচ্ছেদ")).toBe("<p>প্রথম অনুচ্ছেদ</p>\n<p>দ্বিতীয় অনুচ্ছেদ</p>");
  });

  test("bold and emphasis marks convert, lone asterisks stay literal", () => {
    expect(mdToHtml("**সায়েন্টিজম** একটি দর্শন")).toBe("<p><strong>সায়েন্টিজম</strong> একটি দর্শন</p>");
    expect(mdToHtml("এটি *জরুরি* কথা")).toBe("<p>এটি <em>জরুরি</em> কথা</p>");
    expect(mdToHtml("২ * ৩ = ৬")).toBe("<p>২ * ৩ = ৬</p>");
  });

  test("consecutive dash lines become one list", () => {
    const html = mdToHtml("- **নৈতিক সত্য**: বিজ্ঞান বলতে পারে কীভাবে\n- **সৌন্দর্য**: মাপ নেই");
    expect(html).toBe(
      "<ul><li><strong>নৈতিক সত্য</strong>: বিজ্ঞান বলতে পারে কীভাবে</li><li><strong>সৌন্দর্য</strong>: মাপ নেই</li></ul>",
    );
  });

  test("mixed document: heading, paragraphs, list", () => {
    const html = mdToHtml("## ভূমিকা\n\nপ্রথম অনুচ্ছেদ।\n\n- এক\n- দুই\n\nশেষ কথা।");
    expect(html).toBe("<h2>ভূমিকা</h2>\n<p>প্রথম অনুচ্ছেদ।</p>\n<ul><li>এক</li><li>দুই</li></ul>\n<p>শেষ কথা।</p>");
  });

  test("text is HTML-escaped", () => {
    expect(mdToHtml("কুরআন <সূরা> ও & হাদীস")).toBe("<p>কুরআন &lt;সূরা&gt; ও &amp; হাদীস</p>");
  });

  test("already-HTML bodies pass through unchanged (seed idempotence)", () => {
    const html = "<p>আগেই HTML</p>\n<h2>শিরোনাম</h2>";
    expect(mdToHtml(html)).toBe(html);
  });

  test("empty body stays empty", () => {
    expect(mdToHtml("")).toBe("");
  });
});
