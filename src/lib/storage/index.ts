import { PutObjectCommand, S3Client, GetObjectCommand, DeleteObjectCommand, S3ClientConfig } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "@/lib/env";

/**
 * Object storage through an S3-compatible adapter.
 *
 * - S3 driver (default when S3_* env vars exist) — MinIO in the sandbox,
 *   the client's bucket/endpoint in production.
 * - Local disk driver as a zero-config fallback so the app still boots and
 *   uploads work in environments without object storage.
 *
 * All media is served through the app at /api/media/[...key] (streamed with
 * long-lived immutable cache headers), so a single origin serves everything
 * and the bucket is never exposed publicly.
 */

export interface PutResult {
  key: string;
  size: number;
  etag?: string;
}

export interface StorageDriver {
  readonly name: "s3" | "local";
  put(key: string, body: Buffer, contentType: string): Promise<PutResult>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}

/* ————————— S3 driver ————————— */

class S3Driver implements StorageDriver {
  readonly name = "s3" as const;
  private client: S3Client;
  private bucket: string;

  constructor() {
    const cfg = env.s3;
    if (!cfg) throw new Error("S3 driver selected but S3_* env is incomplete");
    const clientConfig: S3ClientConfig = {
      region: cfg.region,
      credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
    };
    if (cfg.endpoint) {
      clientConfig.endpoint = cfg.endpoint;
      clientConfig.forcePathStyle = cfg.forcePathStyle;
    }
    this.client = new S3Client(clientConfig);
    this.bucket = cfg.bucket;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<PutResult> {
    const etag = `"${createHash("md5").update(body).digest("hex")}"`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return { key, size: body.byteLength, etag };
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      const res = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const chunks = res.Body ? await res.Body.transformToByteArray() : new Uint8Array();
      return {
        body: Buffer.from(chunks),
        contentType: res.ContentType ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

/* ————————— Local disk driver (dev fallback) ————————— */

const LOCAL_ROOT = path.join(process.cwd(), "storage-local");

class LocalDriver implements StorageDriver {
  readonly name = "local" as const;

  private fileFor(key: string): string {
    const safe = key.replace(/\\/g, "/").split("/").filter((p) => p !== ".." && p !== "");
    return path.join(LOCAL_ROOT, ...safe);
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<PutResult> {
    const file = this.fileFor(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return { key, size: body.byteLength };
  }

  async get(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    try {
      const file = this.fileFor(key);
      const body = await readFile(file);
      const contentType = guessContentType(file);
      return { body, contentType };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.fileFor(key), { force: true });
  }
}

function guessContentType(file: string): string {
  const ext = path.extname(file).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".txt": "text/plain; charset=utf-8",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext] ?? "application/octet-stream";
}

/* ————————— Driver selection ————————— */

let driver: StorageDriver | null = null;

export function storage(): StorageDriver {
  if (!driver) {
    driver = env.s3 ? new S3Driver() : new LocalDriver();
  }
  return driver;
}

/** Build a dated, collision-free storage key: 2026/10/<hash>.<ext> */
export function storageKeyFor(filename: string): string {
  const ext = path.extname(filename).toLowerCase().slice(0, 10) || ".bin";
  const now = new Date();
  const uuid = createHash("sha256")
    .update(`${filename}:${Date.now()}:${Math.random()}`)
    .digest("hex")
    .slice(0, 24);
  return `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${uuid}${ext}`;
}
