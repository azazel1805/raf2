import type { BookItem } from "./types";

const GB = "https://www.googleapis.com/books/v1/volumes";

export type BookInput =
  | { type: "id"; id: string }
  | { type: "search"; q: string };

/** Play Books / Google Books bağlantısından ID çıkarır, değilse arama sorgusu sayar. */
export function parseBookInput(raw: string): BookInput {
  const t = raw.trim();
  const patterns = [
    /play\.google\.com\/store\/books\/details\/[^?#]*\?(?:[^#]*&)?id=([^&#]+)/i,
    /play\.google\.com\/store\/books\/details\?(?:[^#]*&)?id=([^&#]+)/i,
    /play\.google\.com\/books\/reader\/?(?:\?(?:[^#]*&)?id=([^&#]+))/i,
    /books\.google\.[^/\s]+\/books\/(?:[^?#]*\?(?:[^#]*&)?id=([^&#]+))/i,
    /[?&]id=([A-Za-z0-9_-]{8,})/,
  ];
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m[1]) return { type: "id", id: decodeURIComponent(m[1]) };
  }
  return { type: "search", q: t };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapVolume(j: any): BookItem | null {
  if (!j || j.kind !== "books#volume" || !j.volumeInfo) return null;
  const v = j.volumeInfo;
  let cover: string | undefined =
    v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail;
  if (cover) {
    cover = cover
      .replace(/^http:/, "https:")
      .replace(/zoom=[0-9]+/, "zoom=2")
      .replace(/&edge=curl/g, "");
  }
  const isbn =
    v.industryIdentifiers?.find((x: any) => x.type === "ISBN_13")?.identifier ||
    v.industryIdentifiers?.find((x: any) => x.type === "ISBN_10")?.identifier;
  return {
    id: String(j.id),
    title: v.title || "Adsız Kitap",
    authors: Array.isArray(v.authors) && v.authors.length ? v.authors : ["Yazar bilinmiyor"],
    description: v.description
      ? String(v.description).replace(/<[^>]+>/g, "")
      : undefined,
    cover,
    rating: typeof v.averageRating === "number" ? v.averageRating : undefined,
    ratingsCount: v.ratingsCount,
    pageCount: v.pageCount,
    publisher: v.publisher,
    publishedDate: v.publishedDate,
    categories: Array.isArray(v.categories) ? v.categories.slice(0, 4) : undefined,
    language: v.language,
    isbn,
    playUrl: j.saleInfo?.buyLink || undefined,
    infoUrl: v.canonicalVolumeLink || v.infoLink || undefined,
    addedAt: Date.now(),
    source: "search",
  };
}

export async function fetchVolume(id: string): Promise<BookItem | null> {
  const r = await fetch(`${GB}/${encodeURIComponent(id)}`);
  if (!r.ok) return null;
  const j = await r.json();
  return mapVolume(j);
}

export async function searchVolumes(
  q: string,
  max = 6
): Promise<BookItem[]> {
  const url = `${GB}?q=${encodeURIComponent(q)}&maxResults=${max}`;
  const r = await fetch(url);
  if (!r.ok) return [];
  const j = await r.json();
  if (!Array.isArray(j.items)) return [];
  return j.items
    .map((it: unknown) => mapVolume(it))
    .filter((x: BookItem | null): x is BookItem => x !== null);
}

/* ---------------- siteler ---------------- */

export function normalizeUrl(raw: string): string | null {
  let t = raw.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) t = "https://" + t;
  try {
    const u = new URL(t);
    if (!u.hostname.includes(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const screenshotUrl = (url: string, width = 900, crop = 640) =>
  `https://image.thum.io/get/width/${width}${
    crop ? `/crop/${crop}` : ""
  }/noanimate/${url}`;

export const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;

export async function fetchSiteMeta(
  url: string
): Promise<{ title?: string; provider?: string }> {
  try {
    const r = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`
    );
    if (!r.ok) return {};
    const j = await r.json();
    if (j && j.error) return {};
    return { title: j.title || undefined, provider: j.provider_name || undefined };
  } catch {
    return {};
  }
}

/* ---------------- örnek veri ---------------- */

export const SEED_QUERIES = [
  'intitle:"Çalıkuşu" inauthor:"Reşat Nuri"',
  'intitle:"Kürk Mantolu Madonna"',
  'intitle:"Nutuk" inauthor:"Atatürk"',
  'intitle:"Mai ve Siyah"',
];

export const SEED_SITES: { url: string; title: string }[] = [
  { url: "https://developer.mozilla.org/", title: "MDN Web Docs" },
  { url: "https://www.wikipedia.org/", title: "Wikipedia" },
  { url: "https://dribbble.com/", title: "Dribbble" },
];

/* ---------------- yardımcılar ---------------- */

export function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973;
  return h % 360;
}
