#!/usr/bin/env python3
"""
Subset the self-hosted typefaces into per-script woff2 files for /public/fonts.

Why: next/font/local eagerly preloads EVERY src file via RSC :HL hints, so every
page was downloading all ~760 KB of fonts (both Amiri weights + all Cormorant
weights even on pages that never render those faces). Manual @font-face with
unicode-range lets the browser fetch only the script/weight faces a page actually
renders, and lets the layout preload only the language-critical faces.

Rules of the split (no coverage regression vs. the current dual-script files):
  - bengali face: every codepoint of the source font inside the Bengali orbit
    (U+0951-0952, U+0964-0965, U+0980-09FF, Vedic U+1CD0-1CFF, U+A8F1,
    U+200C-200D ZWJ/ZWNJ, U+25CC dotted circle) — full GSUB closure keeps all
    conjuncts reachable, exactly as today.
  - latin face: every OTHER codepoint of the source font (catch-all, so the
    union of the two faces == the original coverage).
  - arabic face (Amiri): every codepoint in the Arabic orbits (U+0600-08FF,
    U+FB50-FDFF, U+FE70-FEFF, U+1EE00-1EEFF, ZWJ/ZWNJ, U+2E41, U+204F).
    Latin is dropped from Amiri on purpose — Arabic passages on this site are
    pure Arabic; Latin inside .font-arabic contexts falls through the stack.
  - TrueType hinting is stripped for Hind Siliguri + Tiro Bangla (halves the
    bytes; Bengali shaping lives in GSUB/GPOS which are fully preserved).
    Amiri keeps everything except the Latin glyphs.

Deterministic: output filenames carry a content hash for immutable caching.
Re-run after changing any file under src/fonts/ and paste the printed
unicode-range strings into src/app/globals.css.

Usage: python3 scripts/subset-fonts.py   (needs fontTools + brotli)
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "src" / "fonts"
OUT = REPO / "public" / "fonts"

BENGALI_ORBITS = [
    (0x0951, 0x0952),  # devanagari stress marks (used by some Bangla texts)
    (0x0964, 0x0965),  # danda / double danda — Bengali sentence punctuation
    (0x0980, 0x09FF),  # Bengali block
    (0x1CD0, 0x1CFF),  # Vedic extensions (Tiro Bangla carries these)
    (0x200C, 0x200D),  # ZWNJ / ZWJ — required for correct Bangla shaping
    (0x25CC,),         # dotted circle (marks shown standalone)
    (0xA8F1,),         # saurashtra candrabindu (Google keeps it in bengali)
    (0x11DF0, 0x11DF1),  #_EXTENDED bengali-assamese digits? (Google range)
]

ARABIC_ORBITS = [
    (0x0020,),          # space — Arabic runs need it with Amiri's own advance
    (0x00A0,),          # no-break space
    (0x0600, 0x08FF),   # Arabic + extensions + Arabic Supplement/Augmented
    (0x204F,),          # arabic comma fallback? (kept: grammar ambiguity)
    (0x2E41,),          # reverted question mark
    (0x1EE00, 0x1EEFF),  # Arabic Mathematical Alphabetic Symbols (Amiri has them)
    (0xFB50, 0xFDFF),   # Arabic Presentation Forms-A
    (0xFE70, 0xFEFF),   # Arabic Presentation Forms-B
    (0x200C, 0x200D),   # ZWNJ / ZWJ
]


def orbit_membership(cp: int, orbits) -> bool:
    for rng in orbits:
        a = rng[0]
        b = rng[1] if len(rng) > 1 else rng[0]
        if a <= cp <= b:
            return True
    return False


def codepoints_in_orbits(cmap: dict, orbits) -> list[int]:
    return [cp for cp in sorted(cmap) if orbit_membership(cp, orbits)]


def codepoints_outside_orbits(cmap: dict, orbits) -> list[int]:
    return [cp for cp in sorted(cmap) if not orbit_membership(cp, orbits)]


# ————— Amiri "ayah" micro-face ——————————————————————————————————————————
# Every Arabic string the site itself renders (bismillah, hero/page echoes,
# ornaments, admin editor hints) is a FIXED literal in the source tree. A
# micro-face covering exactly those codepoints ships ~37 KB instead of the
# ~106 KB broad Arabic face on pages that render nothing else in Arabic —
# which is every page (the hero bismillah loads Amiri everywhere). The broad
# amiri-arabic-* faces stay declared BEFORE the ayah face (CSS font matching:
# the LATER rule wins for the same family/weight), so the micro-face claims
# exactly its codepoints and any OTHER Arabic (DB-authored quotes,
# admin-pasted text) falls through to the broad faces unchanged.

def decorative_arabic_codepoints() -> list[int]:
    """Union of Arabic-orbit codepoints appearing anywhere under src/ (and
    the seed data the office ships). Superset by design — a codepoint used
    even in a comment costs one glyph, missing one costs broken render."""
    cps: set[int] = {0x0020}  # space — Arabic runs need Amiri's own advance
    roots = [REPO / "src", REPO / "scripts" / "seed-data"]
    for root in roots:
        for path in root.rglob("*"):
            if path.suffix not in {".ts", ".tsx", ".css"}:
                continue
            text = path.read_text(encoding="utf-8")
            for ch in text:
                cp = ord(ch)
                if (
                    0x0600 <= cp <= 0x08FF
                    or 0xFB50 <= cp <= 0xFEFF
                    or cp in (0x200C, 0x200D, 0x2E41, 0x204F)
                ):
                    cps.add(cp)
    return sorted(cps)


def fmt_ranges(cps: list[int]) -> str:
    """Collapse sorted codepoints into U+XXXX, U+XXXX-YYYY ranges for unicode-range."""
    if not cps:
        return ""
    ranges: list[tuple[int, int]] = []
    start = prev = cps[0]
    for cp in cps[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        ranges.append((start, prev))
        start = prev = cp
    ranges.append((start, prev))
    parts = []
    for a, b in ranges:
        if a == b:
            parts.append(f"U+{a:04X}")
        else:
            parts.append(f"U+{a:04X}-{b:04X}")
    return ", ".join(parts)


def subset_to(path: Path, unicodes: list[int], *, no_hinting: bool) -> tuple[TTFont, int]:
    font = TTFont(path)
    opts = Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]  # keep every GSUB/GPOS feature (shaping parity)
    opts.name_IDs = [1, 2]  # family + subfamily only
    opts.drop_tables = sorted(set(opts.drop_tables) | {"DSIG"})
    if no_hinting:
        opts.hinting = False
    ss = Subsetter(opts)
    ss.populate(unicodes=unicodes)
    ss.subset(font)
    return font


def emit(font: TTFont, stem: str, out_dir: Path) -> tuple[str, str, int]:
    """Save with a content-hash filename; return (filename, unicode-range, size)."""
    tmp = out_dir / f"{stem}.tmp.woff2"
    font.save(str(tmp))
    data = tmp.read_bytes()
    digest = hashlib.sha256(data).hexdigest()[:8]
    final = out_dir / f"{stem}.{digest}.woff2"
    shutil.move(str(tmp), str(final))
    cps = sorted(font.getBestCmap())
    return final.name, fmt_ranges(cps), len(data)


def main() -> int:
    if OUT.exists():
        for old in OUT.glob("*.woff2"):
            old.unlink()
    OUT.mkdir(parents=True, exist_ok=True)

    report: dict[str, dict] = {}

    jobs = [
        # (family-dir, file, weight, scripts, no_hinting)
        ("hind-siliguri", "hind-siliguri-v14-bengali_latin-regular.woff2", 400),
        ("hind-siliguri", "hind-siliguri-v14-bengali_latin-500.woff2", 500),
        ("hind-siliguri", "hind-siliguri-v14-bengali_latin-600.woff2", 600),
        ("hind-siliguri", "hind-siliguri-v14-bengali_latin-700.woff2", 700),
        ("tiro-bangla", "tiro-bangla-v8-bengali_latin-regular.woff2", 400),
        ("amiri", "amiri-v30-arabic_latin-regular.woff2", 400),
        ("amiri", "amiri-v30-arabic_latin-700.woff2", 700),
        ("cormorant-garamond", "cormorant-garamond-v21-latin-regular.woff2", 400),
        ("cormorant-garamond", "cormorant-garamond-v21-latin-600.woff2", 600),
        ("cormorant-garamond", "cormorant-garamond-v21-latin-700.woff2", 700),
    ]

    total = 0
    for family_dir, filename, weight in jobs:
        src = SRC / family_dir / filename
        is_amiri = family_dir == "amiri"
        is_cormorant = family_dir == "cormorant-garamond"
        fam = {"hind-siliguri": "hind", "tiro-bangla": "tiro", "amiri": "amiri", "cormorant-garamond": "cormorant"}[family_dir]
        no_hinting = fam in ("hind", "tiro")

        ref = TTFont(src)
        ref_cps = set(ref.getBestCmap())

        if is_amiri:
            orbits = ARABIC_ORBITS
            scripts = [("arabic", codepoints_in_orbits(ref.getBestCmap(), orbits))]
            dropped = ref_cps - set(scripts[0][1])
        elif is_cormorant:
            # Latin-only family: keep everything (catch-all, single face).
            scripts = [("latin", sorted(ref_cps))]
            dropped = set()
        else:
            orbits = BENGALI_ORBITS
            bn = codepoints_in_orbits(ref.getBestCmap(), orbits)
            lat = codepoints_outside_orbits(ref.getBestCmap(), orbits)
            scripts = [("bengali", bn), ("latin", lat)]
            dropped = ref_cps - (set(bn) | set(lat))

        for script, cps in scripts:
            if not cps:
                continue
            font = subset_to(src, cps, no_hinting=no_hinting)
            name, ur, size = emit(font, f"{fam}-{script}-{weight}", OUT)
            total += size
            report[name] = {
                "family": family_dir, "script": script, "weight": weight,
                "unicodeRange": ur, "bytes": size,
            }
            print(f"{name:44s} {size/1024:7.1f} KB  w={weight} {script}")
        if dropped:
            sample = ", ".join(f"U+{c:04X}" for c in sorted(dropped)[:10])
            print(f"  ({family_dir} w={weight}: {len(dropped)} cps dropped -> other scripts/fallbacks: {sample})")

    # Emit the Amiri micro-face LAST: in CSS font matching the LATER
    # @font-face rule wins for the same family/weight, so the micro-face must
    # be declared after the broad amiri-arabic faces to claim its codepoints;
    # any other Arabic (DB quotes, admin-pasted text) still falls through to
    # the broad faces — coverage identical, bytes ~3x smaller.
    ayah_cps = decorative_arabic_codepoints()
    amiri_regular = SRC / "amiri" / "amiri-v30-arabic_latin-regular.woff2"
    amiri_cmap = set(TTFont(amiri_regular).getBestCmap())
    ayah_supported = [cp for cp in ayah_cps if cp in amiri_cmap]
    ayah_font = subset_to(amiri_regular, ayah_supported, no_hinting=False)
    ayah_name, ayah_ur, ayah_size = emit(ayah_font, "amiri-ayah-400", OUT)
    total += ayah_size
    report[ayah_name] = {
        "family": "amiri", "script": "ayah", "weight": 400,
        "unicodeRange": ayah_ur, "bytes": ayah_size,
    }
    print(f"{ayah_name:44s} {ayah_size/1024:7.1f} KB  w=400 ayah  ({len(ayah_supported)} cps of {len(ayah_cps)} scanned)")

    manifest = OUT / "manifest.json"
    manifest.write_text(json.dumps(report, indent=2) + "\n")
    print(f"\nTOTAL: {total/1024:.1f} KB across {len(report)} faces -> {OUT}")

    emit_css(report)
    print("wrote src/app/fonts.css (imported by globals.css)")
    return 0


CSS_FAMILY = {
    "hind-siliguri": ("Hind Siliguri", "Hind Siliguri Fallback"),
    "tiro-bangla": ("Tiro Bangla", "Tiro Bangla Fallback"),
    "amiri": ("Amiri", "Amiri Fallback"),
    "cormorant-garamond": ("Cormorant Garamond", "Cormorant Garamond Fallback"),
}

# Metric-adjusted fallback faces (ascent/descent/line-gap/size-adjust) copied
# from the @font-face blocks next/font generated for these same files — keeps
# the swap-window layout as tight as it was under next/font.
CSS_FALLBACK_METRICS = {
    "tiro-bangla": "ascent-override:73.97%;descent-override:24.0%;line-gap-override:32.33%;size-adjust:102.07%",
    "hind-siliguri": "ascent-override:115.35%;descent-override:51.78%;line-gap-override:0.0%;size-adjust:96.75%",
    "amiri": "ascent-override:124.28%;descent-override:70.1%;line-gap-override:0.0%;size-adjust:90.44%",
    "cormorant-garamond": "ascent-override:105.17%;descent-override:32.67%;line-gap-override:0.0%;size-adjust:87.85%",
}


def emit_css(report: dict) -> None:
    lines = [
        "/* GENERATED by scripts/subset-fonts.py — do not edit by hand.",
        " * Per-script @font-face faces with unicode-range: the browser fetches only",
        " * the faces a page actually renders (was: next/font preloaded every file",
        " * on every page via RSC hints — ~760 KB of fonts per page view).",
        " * Fallback metrics match what next/font computed for these same files. */",
        "",
    ]
    for name, info in report.items():
        fam, _ = CSS_FAMILY[info["family"]]
        lines.append(
            "@font-face {"
            f"font-family:'{fam}';font-style:normal;font-weight:{info['weight']};"
            "font-display:swap;"
            f"src:url('/fonts/{name}') format('woff2');"
            f"unicode-range:{info['unicodeRange']};"
            "}"
        )
    lines.append("")
    for family_dir, (_, fb_name) in CSS_FAMILY.items():
        metrics = CSS_FALLBACK_METRICS[family_dir]
        lines.append(f"@font-face {{font-family:'{fb_name}';src:local(Arial);{metrics}}}")
    lines += [
        "",
        ":root {",
        "  --font-body: \"Hind Siliguri\", \"Hind Siliguri Fallback\";",
        "  --font-heading: \"Tiro Bangla\", \"Tiro Bangla Fallback\";",
        "  --font-arabic: \"Amiri\", \"Amiri Fallback\";",
        "  --font-latin-display: \"Cormorant Garamond\", \"Cormorant Garamond Fallback\";",
        "}",
        "",
    ]
    (REPO / "src" / "app" / "fonts.css").write_text("\n".join(lines))


if __name__ == "__main__":
    sys.exit(main())
