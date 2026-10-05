import { describe, test, expect } from "bun:test";
import { buildFatwaFallbackWhere, buildNoticeFallbackWhere, orderByIds, queryTokens } from "@/lib/db-search";

/**
 * Pure-function coverage for the search layer: token parsing, the ILIKE
 * fallback where-builders (token-AND + case-insensitive — the exact shape that
 * fixed the historical English case-sensitivity bug on /search), and id-order
 * stitching. The ranked tsvector path itself runs against a real PostgreSQL in
 * tests/integration/search.test.ts.
 */

describe("queryTokens", () => {
  test("splits on whitespace and drops empties", () => {
    expect(queryTokens("  যাকাত   হিসাব ")).toEqual(["যাকাত", "হিসাব"]);
    expect(queryTokens("zakat  \t CALCULATOR\n")).toEqual(["zakat", "CALCULATOR"]);
  });

  test("caps runaway queries at 8 tokens", () => {
    const tokens = queryTokens("এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ");
    expect(tokens.length).toBe(8);
  });

  test("blank queries produce no tokens", () => {
    expect(queryTokens("")).toEqual([]);
    expect(queryTokens("   ")).toEqual([]);
  });
});

describe("buildFatwaFallbackWhere", () => {
  test("requires every token (AND) across question and answer", () => {
    const where = buildFatwaFallbackWhere("যাকাত নিসাব");
    const andClauses = where.AND;
    expect(Array.isArray(andClauses)).toBe(true);
    expect(andClauses).toHaveLength(2);
    for (const clause of andClauses as { OR: Record<string, { contains: string; mode: string }>[] }[]) {
      expect(clause.OR).toHaveLength(4);
      for (const branch of clause.OR) {
        const [field, filter] = Object.entries(branch)[0];
        expect(["questionBn", "questionEn", "answerBn", "answerEn"]).toContain(field);
        expect(filter.mode).toBe("insensitive");
      }
    }
  });

  test("keeps published-only and optional category scope", () => {
    expect(buildFatwaFallbackWhere("x").isPublished).toBe(true);
    const scoped = buildFatwaFallbackWhere("x", "muamalat");
    expect(scoped.category).toEqual({ key: "muamalat" });
  });
});

describe("buildNoticeFallbackWhere", () => {
  test("searches title, excerpt and body in both languages", () => {
    const where = buildNoticeFallbackWhere("admission circular");
    const andClauses = where.AND as { OR: Record<string, { contains: string }>[] }[];
    expect(andClauses).toHaveLength(2);
    const fields = new Set(andClauses[0].OR.map((branch) => Object.keys(branch)[0]));
    expect(fields).toEqual(new Set(["titleBn", "titleEn", "excerptBn", "excerptEn", "bodyBn", "bodyEn"]));
    expect(where.isPublished).toBe(true);
  });
});

describe("orderByIds", () => {
  test("reorders hydrated rows to the ranked id order", () => {
    const rows = [
      { id: "c", name: "third" },
      { id: "a", name: "first" },
      { id: "b", name: "second" },
    ];
    const ordered = orderByIds(rows, ["a", "b", "c"]);
    expect(ordered.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  test("drops rows whose id is absent from the order (deleted mid-flight)", () => {
    const rows = [
      { id: "a", name: "kept" },
      { id: "z", name: "stale" },
    ];
    const ordered = orderByIds(rows, ["a"]);
    expect(ordered).toEqual([{ id: "a", name: "kept" }]);
  });

  test("empty ids order yields empty list", () => {
    expect(orderByIds([{ id: "a" }], [])).toEqual([]);
  });
});
