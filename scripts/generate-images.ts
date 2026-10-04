/**
 * One-shot asset generator — recreates the 16 referenced images under
 * public/images/ (they were lost between sessions). Run in background:
 *   nohup bun run scripts/generate-images.ts > /tmp/gen-images.log 2>&1 &
 */
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

interface AssetSpec {
  file: string;
  size: "1440x720" | "1344x768" | "1024x1024";
  prompt: string;
}

const BASE_STYLE =
  "warm cinematic photography, deep emerald green and antique gold and ivory palette, soft golden light, premium editorial look, Islamic geometric architectural motifs, no text, no lettering, no watermark, high quality, detailed";

const ASSETS: AssetSpec[] = [
  {
    file: "hero-campus.png",
    size: "1440x720",
    prompt: `Elegant Bangladeshi Islamic educational institute campus at golden hour, modern three-storey building with pointed arches and a small dome minaret, palm and mango trees, calm pond reflection in foreground, students walking in the distance, ${BASE_STYLE}`,
  },
  {
    file: "campus-library.png",
    size: "1344x768",
    prompt: `Interior of a serene Islamic research library, tall wooden bookshelves with Arabic and English scholarly books, long reading tables with brass lamps, a young Bengali scholar reading, dust motes in warm window light, ${BASE_STYLE}`,
  },
  {
    file: "campus-classroom.png",
    size: "1344x768",
    prompt: `Bright classroom inside a Bangladeshi Islamic institute, rows of wooden desks, young male students in white panjabi and caps studying with notebooks, teacher at a whiteboard at the front, morning light through arched windows, ${BASE_STYLE}`,
  },
  {
    file: "campus-mosque.png",
    size: "1344x768",
    prompt: `Peaceful campus mosque prayer hall interior, green patterned carpet with prayer arches, wooden racks with folded prayer mats, soft light rays through latticed windows, chandelier, ${BASE_STYLE}`,
  },
  {
    file: "student-debate.png",
    size: "1344x768",
    prompt: `Inter-class debate competition at an Islamic institute, a confident young Bengali student speaking at a podium on stage, seated panel of judges, audience of students in the auditorium, banners without readable text, ${BASE_STYLE}`,
  },
  {
    file: "campus-fieldwork.png",
    size: "1344x768",
    prompt: `Street dawah fieldwork in Dhaka, a small group of young Bengali students in panjabi at a decorated table with free books and pamphlets under a canopy, engaging warmly with curious pedestrians, busy street softly blurred, ${BASE_STYLE}`,
  },
  {
    file: "campus-seminar.png",
    size: "1344x768",
    prompt: `National seminar inside a decorated Dhaka auditorium, panel of respected Bengali scholars in robes and turbans seated on a stage with floral stage backdrop, large attentive audience, stage lights, ${BASE_STYLE}`,
  },
  {
    file: "campus-graduation.png",
    size: "1344x768",
    prompt: `Graduation and convocation ceremony of an Islamic institute, graduates in dark green robes and caps receiving certificates on stage, dignitaries handing over scrolls, festive stage with geometric ornament backdrop, ${BASE_STYLE}`,
  },
  {
    file: "azan-training.png",
    size: "1344x768",
    prompt: `Azan training session, a young student practicing call to prayer standing before a small microphone in a music-free hall, ustaad listening attentively with one hand raised guiding melody, other students seated watching, ${BASE_STYLE}`,
  },
  {
    file: "study-circle.png",
    size: "1344x768",
    prompt: `Halaqa study circle, five students seated on floor cushions around a low wooden table with open Arabic books, one reading aloud while others follow along, bookshelves and lantern light behind, intimate warm mood, ${BASE_STYLE}`,
  },
  {
    file: "news-agreement.png",
    size: "1344x768",
    prompt: `Formal bilateral agreement signing ceremony, two distinguished men in formal attire seated at a table signing documents, exchanging pens, observers applauding behind, flags and floral decor, professional event photography, ${BASE_STYLE}`,
  },
  {
    file: "blog-science.png",
    size: "1344x768",
    prompt: `Conceptual editorial illustration: a delicate brass balance scale weighing an atom model against an ancient open manuscript, split composition of laboratory glassware and Islamic astrolabe, deep emerald background with gold accents, flat premium illustration, no text, ${BASE_STYLE}`,
  },
  {
    file: "blog-secularism.png",
    size: "1344x768",
    prompt: `Conceptual editorial illustration: a grand cathedral-like dome on one side fading into a mosque dome with crescent on the other, separated by a golden vertical light beam, symbolizing two worldviews, minimal flat illustration, no text, ${BASE_STYLE}`,
  },
  {
    file: "blog-atheism.png",
    size: "1344x768",
    prompt: `Conceptual editorial illustration: a lone question mark dissolving into golden dust particles that drift upward into a starry cosmos with a subtle geometric islamic star pattern woven into the nebula, dark emerald night sky, no text, ${BASE_STYLE}`,
  },
  {
    file: "blog-feminism.png",
    size: "1344x768",
    prompt: `Conceptual editorial illustration: elegant silhouette of a woman in flowing modest dress with headscarf standing tall, holding a glowing open book, radiating golden geometric star patterns behind her, dignified and empowering, flat premium illustration, no text, ${BASE_STYLE}`,
  },
  {
    file: "blog-orientalism.png",
    size: "1344x768",
    prompt: `Conceptual editorial illustration: a magnifying glass held over an ancient Arabic hadith manuscript, revealing golden chains of linked rings (isnad chains) glowing beneath the faded script, an old orientalist desk in shadow, no text, ${BASE_STYLE}`,
  },
];

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), "public", "images");
  fs.mkdirSync(outDir, { recursive: true });
  const zai = await ZAI.create();

  let ok = 0;
  const failures: string[] = [];

  for (const asset of ASSETS) {
    const outPath = path.join(outDir, asset.file);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000) {
      console.log(`↷ exists: ${asset.file}`);
      ok += 1;
      continue;
    }
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt += 1) {
      try {
        const response = await zai.images.generations.create({
          prompt: asset.prompt,
          size: asset.size,
        });
        const base64 = response.data?.[0]?.base64;
        if (!base64) throw new Error("empty response");
        fs.writeFileSync(outPath, Buffer.from(base64, "base64"));
        console.log(`✓ ${asset.file}`);
        ok += 1;
        done = true;
      } catch (error) {
        console.warn(`attempt ${attempt} failed for ${asset.file}: ${String(error)}`);
        await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
      }
    }
    if (!done) failures.push(asset.file);
  }

  console.log(`DONE ok=${ok}/${ASSETS.length}` + (failures.length ? ` failed=${failures.join(",")}` : ""));
}

main().catch((error) => {
  console.error("FATAL", error);
  process.exit(1);
});
