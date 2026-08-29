import type { BookItem, SiteItem } from "./types";
import { LS_BOOKS, LS_SITES } from "./types";

export type SaveResult = "ok" | "unauthorized" | "error";

export interface CatalogPayload {
  books: BookItem[];
  sites: SiteItem[];
  savedAt?: number | null;
}

/* ----- yerel önbellek (çevrimdışı + anında açılış) ----- */

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* kota dolu vb. — sessiz geç */
  }
}

export const localBooks = () => readLocal<BookItem[]>(LS_BOOKS, []);
export const localSites = () => readLocal<SiteItem[]>(LS_SITES, []);

/* ----- Netlify Functions (/api/catalog) ----- */

/**
 * Sunucudan paylaşılan kataloğu çeker.
 * Fonksiyona ulaşılamazsa (çevrimdışı / deploy edilmedi) null döner;
 * istemci o zaman yerel önbelleği kullanır.
 */
export async function loadCatalog(): Promise<{
  data: CatalogPayload | null;
  fromServer: boolean;
}> {
  try {
    const r = await fetch("/api/catalog", {
      headers: { Accept: "application/json" },
    });
    if (!r.ok) return { data: null, fromServer: false };
    const j = (await r.json()) as CatalogPayload;
    if (j && Array.isArray(j.books) && Array.isArray(j.sites)) {
      return { data: j, fromServer: true };
    }
    return { data: null, fromServer: false };
  } catch {
    return { data: null, fromServer: false };
  }
}

/**
 * Kataloğu sunucuya yazar. Yönetici anahtarı X-Admin-Key başlığıyla gider;
 * fonksiyon bunu sunucu tarafındaki ADMIN_PASSWORD ile karşılaştırır.
 */
export async function saveCatalog(
  books: BookItem[],
  sites: SiteItem[],
  adminKey: string
): Promise<SaveResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (adminKey) headers["X-Admin-Key"] = adminKey;
    const r = await fetch("/api/catalog", {
      method: "POST",
      headers,
      body: JSON.stringify({ books, sites }),
    });
    if (r.status === 403) return "unauthorized";
    if (!r.ok) return "error";
    return "ok";
  } catch {
    return "error";
  }
}
