/**
 * YouTube reference parsing — the office pastes whatever they find: a bare
 * 11-character ID, a watch URL, a short youtu.be link, or an embed URL.
 * We persist the canonical 11-character ID so every consumer can build
 * thumbnails (img.youtube.com) and embeds the same way.
 */

const ID_RE = /^[\w-]{11}$/;

/** Extract the 11-char video id from an id/url/short/embed string. */
export function parseYouTubeId(input: string): string | null {
  const value = (input ?? "").trim();
  if (!value) return null;
  if (ID_RE.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return ID_RE.test(id) ? id : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v && ID_RE.test(v)) return v;
    // /embed/<id> or /shorts/<id> or /live/<id>
    const parts = url.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
      const id = parts[1] ?? "";
      return ID_RE.test(id) ? id : null;
    }
  }
  return null;
}

/** Embed URL for a stored 11-char id (privacy-enhanced host). */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/** Thumbnail URL for a stored 11-char id. */
export function youtubeThumbUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
