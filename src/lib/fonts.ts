import localFont from "next/font/local";

/**
 * Self-hosted typefaces (woff2, subset to the scripts the site uses). The build no longer
 * reaches fonts.googleapis.com — the server's build network cannot — and visitors load the
 * fonts from this origin, which the brief asked for. Same CSS variables as before.
 */
export const tiroBangla = localFont({
  variable: "--font-heading",
  display: "swap",
  src: [
    { path: "../fonts/tiro-bangla/tiro-bangla-v8-bengali_latin-regular.woff2", weight: "400", style: "normal" },
  ],
});

export const hindSiliguri = localFont({
  variable: "--font-body",
  display: "swap",
  src: [
    { path: "../fonts/hind-siliguri/hind-siliguri-v14-bengali_latin-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/hind-siliguri/hind-siliguri-v14-bengali_latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/hind-siliguri/hind-siliguri-v14-bengali_latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/hind-siliguri/hind-siliguri-v14-bengali_latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/hind-siliguri/hind-siliguri-v14-bengali_latin-regular.woff2", weight: "400", style: "normal" },
  ],
});

export const amiri = localFont({
  variable: "--font-arabic",
  display: "swap",
  src: [
    { path: "../fonts/amiri/amiri-v30-arabic_latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/amiri/amiri-v30-arabic_latin-700italic.woff2", weight: "700", style: "italic" },
    { path: "../fonts/amiri/amiri-v30-arabic_latin-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/amiri/amiri-v30-arabic_latin-regular.woff2", weight: "400", style: "normal" },
  ],
});

export const cormorant = localFont({
  variable: "--font-latin-display",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-500italic.woff2", weight: "500", style: "italic" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-600italic.woff2", weight: "600", style: "italic" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-700italic.woff2", weight: "700", style: "italic" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-italic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/cormorant-garamond/cormorant-garamond-v21-latin-regular.woff2", weight: "400", style: "normal" },
  ],
});
