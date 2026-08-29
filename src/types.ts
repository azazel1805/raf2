export interface BookItem {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  cover?: string;
  rating?: number;
  ratingsCount?: number;
  pageCount?: number;
  publisher?: string;
  publishedDate?: string;
  categories?: string[];
  language?: string;
  isbn?: string;
  playUrl?: string;
  infoUrl?: string;
  note?: string;
  /** Kullanıcı vitrine el ile seçtiyse true */
  featured?: boolean;
  addedAt: number;
  source: "play" | "search" | "manual";
}

export interface SiteItem {
  id: string;
  url: string;
  domain: string;
  title: string;
  provider?: string;
  note?: string;
  addedAt: number;
}

export type ToastKind = "success" | "info" | "error";

export interface ToastMsg {
  id: number;
  msg: string;
  kind: ToastKind;
  actionLabel?: string;
  onAction?: () => void;
}

export type Tab = "books" | "sites";

export const LS_BOOKS = "raflik.books.v1";
export const LS_SITES = "raflik.sites.v1";
export const LS_UNLOCKED = "raf.unlocked.v1";

export function fmtNum(n: number): string {
  return n.toLocaleString("tr-TR");
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function trunc(s: string, n = 32): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

export const LANGS: Record<string, string> = {
  tr: "Türkçe",
  en: "İngilizce",
  de: "Almanca",
  fr: "Fransızca",
  es: "İspanyolca",
  it: "İtalyanca",
  ru: "Rusça",
  ar: "Arapça",
};
