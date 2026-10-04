import sharp from "sharp";
import { storage, storageKeyFor } from "@/lib/storage";

/**
 * Upload pipeline: validate → store original → generate sized variants →
 * return the Media row payload (caller persists it in Prisma).
 *
 * Validation is by magic bytes + declared type agreement, not by trusting
 * the client's Content-Type or filename.
 */

const IMAGE_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const DOC_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
};

export const IMAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const DOC_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export interface VariantInfo {
  key: string;
  width: number;
  height: number;
  size: number;
}

export interface UploadedMedia {
  key: string;
  filename: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  kind: "IMAGE" | "DOCUMENT";
  variants?: Record<string, VariantInfo>;
}

/** Detect real content type from magic bytes. */
function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

export function validateUpload(
  filename: string,
  declaredType: string,
  buf: Buffer,
): { ok: true; mime: string; kind: "IMAGE" | "DOCUMENT" } | { ok: false; error: string } {
  const sniffed = sniffMime(buf);
  if (!sniffed) return { ok: false, error: "ফাইলের ধরন সনাক্ত করা যায়নি (শুধু JPG, PNG, WEBP ছবি এবং PDF ডকুমেন্ট গ্রহণযোগ্য)।" };
  if (sniffed !== declaredType) return { ok: false, error: "ফাইলের প্রকৃত ধরন ঘোষিত ধরনের সাথে মেলেনি।" };
  const isImage = sniffed in IMAGE_TYPES;
  const isDoc = sniffed in DOC_TYPES;
  if (!isImage && !isDoc) return { ok: false, error: "এই ধরনের ফাইল গ্রহণযোগ্য নয়।" };
  const limit = isImage ? IMAGE_MAX_BYTES : DOC_MAX_BYTES;
  if (buf.byteLength > limit) {
    return { ok: false, error: `ফাইল সাইজ সীমা ${Math.round(limit / 1024 / 1024)}MB এর বেশি।` };
  }
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  const allowed = isImage ? IMAGE_TYPES[sniffed] : DOC_TYPES[sniffed];
  if (!allowed.includes(ext)) {
    return { ok: false, error: "ফাইল এক্সটেনশন বৈধ নয়।" };
  }
  return { ok: true, mime: sniffed, kind: isImage ? "IMAGE" : "DOCUMENT" };
}

/** Store an image with generated variants (thumb 400 / md 800 / lg 1200). */
export async function uploadImage(filename: string, buf: Buffer): Promise<UploadedMedia> {
  const sniffed = sniffMime(buf);
  if (!sniffed || !(sniffed in IMAGE_TYPES)) {
    throw new Error("শুধুমাত্র JPG, PNG বা WEBP ছবি গ্রহণযোগ্য।");
  }
  const check = validateUpload(filename, sniffed, buf);
  if (!check.ok) throw new Error(check.error);
  return persistImage(filename, buf, check.mime);
}

async function persistImage(filename: string, buf: Buffer, mime: string): Promise<UploadedMedia> {
  const store = storage();
  const key = storageKeyFor(filename);
  await store.put(key, buf, mime);

  const image = sharp(buf, { failOn: "error" });
  const meta = await image.metadata();
  const variants: Record<string, VariantInfo> = {};

  const widths: Array<[string, number]> = [
    ["thumb", 400],
    ["md", 800],
    ["lg", 1200],
  ];
  for (const [name, width] of widths) {
    if ((meta.width ?? 0) <= width) continue; // never upscale
    const out = await sharp(buf)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const variantKey = key.replace(/\.[^.]+$/, `.${name}.webp`);
    await store.put(variantKey, out, "image/webp");
    const vMeta = await sharp(out).metadata();
    variants[name] = {
      key: variantKey,
      width: vMeta.width ?? width,
      height: vMeta.height ?? 0,
      size: out.byteLength,
    };
  }

  return {
    key,
    filename,
    mime,
    size: buf.byteLength,
    width: meta.width ?? undefined,
    height: meta.height ?? undefined,
    kind: "IMAGE",
    variants: Object.keys(variants).length ? variants : undefined,
  };
}

/** Store a document (PDF) as-is. */
export async function uploadDocument(filename: string, buf: Buffer): Promise<UploadedMedia> {
  const sniffed = sniffMime(buf);
  if (!sniffed || !(sniffed in DOC_TYPES)) {
    throw new Error("শুধুমাত্র PDF ডকুমেন্ট গ্রহণযোগ্য।");
  }
  const check = validateUpload(filename, sniffed, buf);
  if (!check.ok) throw new Error(check.error);
  const key = storageKeyFor(filename);
  await storage().put(key, buf, sniffed);
  return { key, filename, mime: sniffed, size: buf.byteLength, kind: "DOCUMENT" };
}

export { sniffMime };
