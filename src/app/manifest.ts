import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "আস-সুন্নাহ দাওয়াহ অ্যান্ড রিসার্চ ইনস্টিটিউট",
    short_name: "আস-সুন্নাহ",
    description:
      "কুরআন-সুন্নাহভিত্তিক গবেষণা, দাওয়াহ প্রশিক্ষণ ও উচ্চশিক্ষার প্রতিষ্ঠান — ঢাকা, বাংলাদেশ।",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#faf8f2",
    theme_color: "#0e5940",
    lang: "bn",
    categories: ["education", "news"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "নোটিশ বোর্ড",
        short_name: "নোটিশ",
        url: "/notices",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "ফতোয়া ব্যাংক",
        short_name: "ফতোয়া",
        url: "/research/fatwa",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "সহযোগিতা করুন",
        short_name: "ডোনেশন",
        url: "/support",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
