import { describe, test, expect } from "bun:test";
import { NextRequest } from "next/server";
import {
  LANGS,
  DEFAULT_LANG,
  isLang,
  langPath,
  otherLang,
  alternatesFor,
  htmlLangAttrs,
  displayPath,
} from "@/lib/locale";
import { proxy } from "@/proxy";

describe("isLang", () => {
  test("accepts exactly the two supported languages", () => {
    expect(LANGS).toEqual(["bn", "en"]);
    expect(DEFAULT_LANG).toBe("bn");
    expect(isLang("bn")).toBe(true);
    expect(isLang("en")).toBe(true);
    expect(isLang("fr")).toBe(false);
    expect(isLang("BN")).toBe(false);
    expect(isLang("")).toBe(false);
  });
});

describe("langPath", () => {
  test("Bangla (default) keeps the bare path", () => {
    expect(langPath("bn", "/notices")).toBe("/notices");
    expect(langPath("bn", "/")).toBe("/");
    expect(langPath("bn", "notices")).toBe("/notices"); // relative gets a slash
  });

  test("English prefixes /en", () => {
    expect(langPath("en", "/notices")).toBe("/en/notices");
    expect(langPath("en", "/")).toBe("/en");
    expect(langPath("en", "notices")).toBe("/en/notices");
    expect(langPath("en", "/courses/pys")).toBe("/en/courses/pys");
  });
});

describe("otherLang", () => {
  test("switcher target", () => {
    expect(otherLang("bn")).toBe("en");
    expect(otherLang("en")).toBe("bn");
  });
});

describe("alternatesFor (hreflang)", () => {
  const site = "https://assunnahinstitute.org";

  test("home: bn canonical, en under /en, x-default bn", () => {
    const a = alternatesFor("/", site);
    expect(a.canonical).toBe(`${site}/`);
    expect(a.languages.bn).toBe(`${site}/`);
    expect(a.languages.en).toBe(`${site}/en`);
    expect(a.languages["x-default"]).toBe(`${site}/`);
  });

  test("inner page: bn keeps the path, en gets /en prefix", () => {
    const a = alternatesFor("/notices", site);
    expect(a.canonical).toBe(`${site}/notices`);
    expect(a.languages.bn).toBe(`${site}/notices`);
    expect(a.languages.en).toBe(`${site}/en/notices`);
  });
});

describe("htmlLangAttrs", () => {
  test("lang + ltr for both locales", () => {
    expect(htmlLangAttrs("bn")).toEqual({ lang: "bn", dir: "ltr" });
    expect(htmlLangAttrs("en")).toEqual({ lang: "en", dir: "ltr" });
  });
});

describe("displayPath (post-rewrite pathname → public path)", () => {
  test("strips the /en or /bn internal prefix", () => {
    expect(displayPath("/en")).toBe("/");
    expect(displayPath("/en/notices")).toBe("/notices");
    expect(displayPath("/bn/notices")).toBe("/notices");
  });

  test("passes admin/api paths through untouched", () => {
    expect(displayPath("/admin/notices")).toBe("/admin/notices");
    expect(displayPath("/api/health")).toBe("/api/health");
  });
});

describe("proxy (locale rewrite + reserved paths)", () => {
  const make = (pathname: string): NextRequest =>
    new NextRequest(`http://localhost:3000${pathname}`);

  test("public paths rewrite to the internal /bn route, URL stays public", () => {
    const res = proxy(make("/notices?q=ভর্তি"));
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/bn/notices?q=%E0%A6%AD%E0%A6%B0%E0%A7%8D%E0%A6%A4%E0%A6%BF",
    );
  });

  test("root rewrites to /bn with no trailing path", () => {
    const res = proxy(make("/"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("http://localhost:3000/bn");
    expect(res.headers.get("x-middleware-next")).toBeNull();
  });

  test("/en/* passes through as the lang=en route (no rewrite)", () => {
    const res = proxy(make("/en/notices"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  test("reserved prefixes are never rewritten: /api, /admin, /_next, /sw.js", () => {
    for (const path of ["/api/donations", "/admin/users", "/_next/static/chunk.js", "/sw.js", "/offline"]) {
      const res = proxy(make(path));
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    }
  });

  test("static-looking files (extension in last segment) are not rewritten", () => {
    for (const path of ["/logo.svg", "/images/hero.webp", "/manifest.webmanifest"]) {
      const res = proxy(make(path));
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    }
  });

  test("signed sandbox checkout flows through the default-lang rewrite", () => {
    const res = proxy(make("/checkout/DN-2026-000001"));
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      "http://localhost:3000/bn/checkout/DN-2026-000001",
    );
  });

  test("every response carries the OWASP security headers", () => {
    const res = proxy(make("/"));
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(res.headers.get("Permissions-Policy")).toContain("camera=()");
  });
});
