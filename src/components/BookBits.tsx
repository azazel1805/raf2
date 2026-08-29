import { useState, type FormEvent } from "react";
import type { BookItem } from "../types";
import { fmtDate, fmtNum, LANGS, trunc } from "../types";
import { hashHue } from "../api";
import {
  BookIcon,
  ExternalIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
  StarIcon,
  TrashIcon,
  XIcon,
} from "../icons";
import { Reveal } from "./Shared";

/* ---------------- kapak ---------------- */

export function BookCover({
  book,
  className = "",
  titleSize = "text-[13px]",
}: {
  book: Pick<BookItem, "title" | "authors" | "cover">;
  className?: string;
  titleSize?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (book.cover && !failed) {
    return (
      <img
        src={book.cover}
        alt={book.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  const h = hashHue(book.title);
  return (
    <div
      className={`flex h-full w-full flex-col justify-between p-3 ${className}`}
      style={{
        background: `linear-gradient(155deg, hsl(${h} 38% 27%), hsl(${(h + 45) % 360} 46% 12%))`,
      }}
    >
      <div className="h-1 w-8 rounded-full bg-amber/70" />
      <div>
        <p
          className={`font-display ${titleSize} font-semibold italic leading-snug text-cream/95 line-clamp-4`}
        >
          {book.title}
        </p>
        <p className="mt-1.5 text-[10px] uppercase tracking-[0.16em] text-cream/50 line-clamp-1">
          {book.authors[0] ?? ""}
        </p>
      </div>
      <div className="h-px w-full bg-cream/15" />
    </div>
  );
}

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-[2px]" aria-label={`${rating} / 5 puan`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          size={size}
          className={i < full ? "text-amber" : "text-line"}
        />
      ))}
    </span>
  );
}

/* ---------------- ekleme çubuğu ---------------- */

export function AddBookBar({
  value,
  onChange,
  busy,
  error,
  results,
  onSubmit,
  onPick,
  onClear,
  onManual,
  locked = false,
  onLocked,
}: {
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  error: string | null;
  results: BookItem[];
  onSubmit: () => void;
  onPick: (b: BookItem) => void;
  onClear: () => void;
  onManual: () => void;
  locked?: boolean;
  onLocked?: () => void;
}) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (locked) {
      onLocked?.();
      return;
    }
    if (value.trim() && !busy) onSubmit();
  };
  return (
    <section className="sticky top-0 z-30 border-b border-line/70 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
            Google Play kitabı ekle
          </h2>
          <p className="hidden text-xs text-fog sm:block">
            Play bağlantısını yapıştır ya da kitap adını yaz — gerisini Raf halleder.
          </p>
        </div>
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
            />
            <input
              id="book-input"
              value={locked ? "" : value}
              onChange={(e) => onChange(e.target.value)}
              disabled={locked}
              placeholder={
                locked
                  ? "Ekleme kilitli — yönetici şifresi gerekli"
                  : "https://play.google.com/store/books/details?id=…  veya  “Simyacı”"
              }
              className="w-full rounded-lg border border-line bg-pine py-2.5 pl-10 pr-3 text-sm text-cream placeholder:text-fog/60 transition focus:border-amber/60 focus:bg-moss focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Google Play bağlantısı veya kitap adı"
            />
          </div>
          <button
            type="submit"
            disabled={busy || (!locked && !value.trim())}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 ${
              locked
                ? "border border-amber/50 bg-transparent text-amber hover:bg-amber/10 disabled:opacity-100"
                : "bg-amber text-ink hover:bg-ambersoft"
            }`}
          >
            {busy ? (
              <SpinnerIcon size={16} />
            ) : locked ? (
              <LockIcon size={16} />
            ) : (
              <PlusIcon size={16} />
            )}
            <span className="hidden sm:inline">
              {locked ? "Kilitli — şifre gir" : "Tek Tıkla Ekle"}
            </span>
            <span className="sm:hidden">{locked ? "Kilitli" : "Ekle"}</span>
          </button>
        </form>

        {error && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-clay">
            <span>{error}</span>
            <button
              onClick={locked ? onLocked : onManual}
              className="rounded-md border border-clay/40 px-2 py-0.5 text-xs font-semibold text-clay transition hover:bg-clay hover:text-ink active:scale-95"
            >
              Manuel ekle
            </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-fog">
                Arama sonuçları — kapağa dokun, rafa girsin:
              </p>
              <button
                onClick={onClear}
                className="flex items-center gap-1 text-xs text-fog transition hover:text-cream"
              >
                <XIcon size={12} /> Temizle
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1.5">
              {results.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onPick(b)}
                  className="group flex min-w-[230px] shrink-0 items-center gap-3 rounded-lg border border-line bg-moss p-2 pr-3 text-left transition hover:-translate-y-0.5 hover:border-amber/60 active:scale-[0.98]"
                >
                  <span className="block h-14 w-10 shrink-0 overflow-hidden rounded-sm border border-line/60">
                    <BookCover book={b} titleSize="text-[6px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-cream group-hover:text-ambersoft">
                      {b.title}
                    </span>
                    <span className="block truncate text-xs text-fog">
                      {b.authors[0]}
                    </span>
                  </span>
                  <PlusIcon size={16} className="shrink-0 text-amber transition group-hover:rotate-90" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- kitap kartı ---------------- */

export function BookCard({
  book,
  index,
  onOpen,
  onDelete,
  onToggleFeature,
}: {
  book: BookItem;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  onToggleFeature: () => void;
}) {
  return (
    <Reveal delay={(index % 6) * 45}>
      <article className="group relative">
        <button onClick={onOpen} className="block w-full text-left">
          <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-line bg-pine shadow-lg shadow-black/30 transition-all duration-300 group-hover:-translate-y-2 group-hover:-rotate-1 group-hover:border-amber/50 group-hover:shadow-2xl group-hover:shadow-black/60">
            <BookCover book={book} />
            {book.source === "play" && (
              <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ambersoft backdrop-blur-sm">
                Play
              </span>
            )}
            <span className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/95 via-ink/25 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber">
                <BookIcon size={13} /> Detay & içerik bilgisi
              </span>
            </span>
          </div>
          <div className="wood h-[7px] rounded-b-[5px]" />
          <h3 className="mt-2.5 font-display text-[15px] font-semibold leading-tight text-cream line-clamp-1 transition-colors group-hover:text-ambersoft">
            {book.title}
          </h3>
          <p className="mt-0.5 text-xs text-fog line-clamp-1">{book.authors.join(", ")}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {book.rating ? (
              <>
                <Stars rating={book.rating} size={11} />
                <span className="text-[11px] font-semibold text-cream/70">
                  {book.rating.toLocaleString("tr-TR")}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-fog/70">
                {book.pageCount ? `${fmtNum(book.pageCount)} sayfa` : "katalogda"}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={onToggleFeature}
          aria-label={book.featured ? "Vitrinden çıkar" : "Vitrine koy"}
          title={book.featured ? "Vitrinden çıkar" : "Vitrine koy"}
          className={`absolute left-1.5 top-1.5 z-10 rounded-md border p-1.5 transition active:scale-90 ${
            book.featured
              ? "border-amber/80 bg-amber text-ink opacity-100 shadow-md shadow-amber/30 hover:bg-ambersoft"
              : "border-line bg-ink/85 text-fog opacity-0 hover:border-amber/60 hover:text-amber focus-visible:opacity-100 group-hover:opacity-100"
          }`}
        >
          <StarIcon size={13} filled={book.featured} />
        </button>
        <button
          onClick={onDelete}
          aria-label={`${trunc(book.title)} kitabını sil`}
          className="absolute right-1.5 top-1.5 z-10 rounded-md border border-line bg-ink/85 p-1.5 text-fog opacity-0 transition hover:border-clay/60 hover:text-clay focus-visible:opacity-100 group-hover:opacity-100 active:scale-90"
        >
          <TrashIcon size={13} />
        </button>
      </article>
    </Reveal>
  );
}

/* ---------------- detay modalı ---------------- */

function Meta({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-fog">{label}</p>
      <p className="mt-0.5 text-sm text-cream/90">{value || "—"}</p>
    </div>
  );
}

export function BookModal({
  book,
  onClose,
  onDelete,
  onNote,
  onToggleFeature,
  locked = false,
}: {
  book: BookItem;
  onClose: () => void;
  onDelete: () => void;
  onNote: (note: string) => void;
  onToggleFeature: () => void;
  locked?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(book.note ?? "");
  const [saved, setSaved] = useState(false);
  const longDesc = (book.description?.length ?? 0) > 420;

  const saveNote = () => {
    if (note !== (book.note ?? "")) {
      onNote(note);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-pine shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
          Kitap detayı
        </p>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-md p-1.5 text-fog transition hover:bg-moss hover:text-cream active:scale-90"
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="grid gap-7 p-6 md:grid-cols-[220px_1fr] md:p-7">
        <div>
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line shadow-xl shadow-black/50">
            <BookCover book={book} titleSize="text-sm" />
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {(book.playUrl || book.infoUrl) && (
              <a
                href={book.playUrl ?? book.infoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-amber px-3 py-2.5 text-[13px] font-bold text-ink transition hover:bg-ambersoft active:scale-[0.98]"
              >
                <ExternalIcon size={14} />
                {book.playUrl ? "Google Play'de aç" : "Önizlemeyi aç"}
              </a>
            )}
            {book.playUrl && book.infoUrl && (
              <a
                href={book.infoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] font-semibold text-fog transition hover:border-amber/50 hover:text-cream active:scale-[0.98]"
              >
                <BookIcon size={14} /> Google Books önizleme
              </a>
            )}
            <button
              onClick={onToggleFeature}
              className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold transition active:scale-[0.98] ${
                book.featured
                  ? "border-amber/70 bg-amber/15 text-amber hover:bg-amber/25"
                  : "border-line text-fog hover:border-amber/50 hover:text-amber"
              }`}
            >
              <StarIcon size={14} filled={book.featured} />
              {book.featured ? "Vitrinde — çıkar" : "Vitrine koy"}
            </button>
          </div>
        </div>

        <div className="min-w-0">
          <span className="inline-block rounded-full border border-teal/40 bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal">
            {book.source === "play" ? "Play'den eklendi" : book.source === "search" ? "Aramayla eklendi" : "Elle eklendi"}
          </span>
          <h2 className="mt-2 font-display text-2xl font-black leading-tight text-cream md:text-3xl">
            {book.title}
          </h2>
          <p className="mt-1 text-sm text-fog">{book.authors.join(", ")}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {book.rating ? (
              <span className="flex items-center gap-2">
                <Stars rating={book.rating} />
                <span className="text-sm font-bold text-cream">
                  {book.rating.toLocaleString("tr-TR")}
                </span>
                {book.ratingsCount ? (
                  <span className="text-xs text-fog">({fmtNum(book.ratingsCount)} oy)</span>
                ) : null}
              </span>
            ) : null}
            {book.categories?.map((c) => (
              <span
                key={c}
                className="rounded-full border border-line px-2.5 py-0.5 text-[11px] text-cream/70"
              >
                {c}
              </span>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 rounded-lg border border-line/70 bg-ink/40 p-4 sm:grid-cols-3">
            <Meta label="Yayınevi" value={book.publisher} />
            <Meta label="Yayın tarihi" value={book.publishedDate} />
            <Meta label="Sayfa" value={book.pageCount ? fmtNum(book.pageCount) : undefined} />
            <Meta label="Dil" value={book.language ? LANGS[book.language] ?? book.language.toUpperCase() : undefined} />
            <Meta label="ISBN" value={book.isbn} />
            <Meta label="Eklenme" value={fmtDate(book.addedAt)} />
          </div>

          <div className="mt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
              İçerik bilgisi
            </p>
            {book.description ? (
              <>
                <p
                  className={`mt-2 text-sm leading-relaxed text-cream/80 ${
                    expanded ? "" : "line-clamp-5"
                  }`}
                >
                  {book.description}
                </p>
                {longDesc && (
                  <button
                    onClick={() => setExpanded((x) => !x)}
                    className="mt-1.5 text-xs font-bold text-amber transition hover:text-ambersoft"
                  >
                    {expanded ? "Kapat ↑" : "Devamını oku ↓"}
                  </button>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm text-fog/70">
                Bu kitap için açıklama bulunamadı. "Google Play'de aç" ile tüm içeriğe ulaşabilirsin.
              </p>
            )}
          </div>

          <div className="mt-5">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-fog">
              <PencilIcon size={12} /> Kişisel not
              {saved && <span className="text-teal normal-case tracking-normal">— kaydedildi ✓</span>}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              disabled={locked}
              rows={2}
              placeholder={
                locked
                  ? "Notlar yalnızca yönetici tarafından düzenlenebilir."
                  : "Bu kitaba dair notun… (tarayıcında saklanır)"
              }
              className="mt-2 w-full resize-none rounded-lg border border-line bg-ink p-3 text-sm text-cream placeholder:text-fog/50 transition focus:border-amber/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-6 py-3">
        <p className="text-xs text-fog">Rafa eklenme: {fmtDate(book.addedAt)}</p>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md border border-clay/40 px-3 py-1.5 text-xs font-bold text-clay transition hover:bg-clay hover:text-ink active:scale-95"
        >
          <TrashIcon size={13} /> Raftan indir
        </button>
      </div>
    </div>
  );
}

/* ---------------- manuel ekleme ---------------- */

export function ManualBookModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (b: BookItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [cover, setCover] = useState("");
  const [desc, setDesc] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({
      id: `manual-${Date.now()}`,
      title: title.trim(),
      authors: author.trim() ? [author.trim()] : ["Yazar bilinmiyor"],
      cover: cover.trim() || undefined,
      description: desc.trim() || undefined,
      addedAt: Date.now(),
      source: "manual",
    });
  };

  const field =
    "w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-fog/50 transition focus:border-amber/60 focus:outline-none";

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-pine shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber">
          Elle kitap ekle
        </p>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-md p-1.5 text-fog transition hover:bg-moss hover:text-cream active:scale-90"
        >
          <XIcon size={16} />
        </button>
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3 p-6">
        <div>
          <label className="mb-1 block text-xs font-semibold text-fog">Kitap adı *</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="örn. Puslu Kıtalar Atlası" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-fog">Yazar</label>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="örn. İhsan Oktay Anar" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-fog">Kapak görseli URL (isteğe bağlı)</label>
          <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-fog">Açıklama</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Konusu, neden sevdiğin…" className={`${field} resize-none`} />
        </div>
        <button
          type="submit"
          disabled={!title.trim()}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-amber px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ambersoft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <PlusIcon size={15} /> Rafa koy
        </button>
      </form>
    </div>
  );
}
