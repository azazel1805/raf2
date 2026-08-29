import { useState, type FormEvent } from "react";
import type { SiteItem } from "../types";
import { fmtDate, trunc } from "../types";
import { faviconUrl, normalizeUrl, screenshotUrl } from "../api";
import {
  EyeIcon,
  ExternalIcon,
  GlobeIcon,
  LinkIcon,
  LockIcon,
  NoteIcon,
  PencilIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
  XIcon,
} from "../icons";
import { Reveal } from "./Shared";

/* ---------------- ekleme çubuğu ---------------- */

export function AddSiteBar({
  value,
  onChange,
  busy,
  onSubmit,
  locked = false,
  onLocked,
}: {
  value: string;
  onChange: (v: string) => void;
  busy: boolean;
  onSubmit: (url: string) => void;
  locked?: boolean;
  onLocked?: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (locked) {
      onLocked?.();
      return;
    }
    const url = normalizeUrl(value);
    if (!url) {
      setErr("Geçerli bir adres yaz — örn. portfoy.site veya https://example.com");
      return;
    }
    setErr(null);
    onSubmit(url);
  };

  return (
    <section className="sticky top-0 z-30 border-b border-line/70 bg-ink/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-5 py-3.5">
        <div className="flex items-baseline gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-teal">
            Web siteni ekle
          </h2>
          <p className="hidden text-xs text-fog sm:block">
            URL'yi yapıştır — ekran görüntüsü ve canlı önizleme otomatik hazırlanır.
          </p>
        </div>
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <div className="relative flex-1">
            <LinkIcon
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fog"
            />
            <input
              id="site-input"
              value={locked ? "" : value}
              onChange={(e) => {
                onChange(e.target.value);
                if (err) setErr(null);
              }}
              disabled={locked}
              placeholder={locked ? "Ekleme kilitli — yönetici şifresi gerekli" : "https://yeni-siten.com"}
              className={`w-full rounded-lg border bg-pine py-2.5 pl-10 pr-3 text-sm text-cream placeholder:text-fog/60 transition focus:bg-moss focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                err ? "border-clay/70" : "border-line focus:border-teal/60"
              }`}
              aria-label="Web sitesi adresi"
            />
          </div>
          <button
            type="submit"
            disabled={busy || (!locked && !value.trim())}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 ${
              locked
                ? "border border-teal/50 bg-transparent text-teal hover:bg-teal/10 disabled:opacity-100"
                : "bg-teal text-ink hover:brightness-110"
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
              {locked ? "Kilitli — şifre gir" : "Ekle & Önizle"}
            </span>
            <span className="sm:hidden">{locked ? "Kilitli" : "Ekle"}</span>
          </button>
        </form>
        {err && <p className="mt-2 text-[13px] text-clay">{err}</p>}
      </div>
    </section>
  );
}

/* ---------------- site kartı ---------------- */

function Favicon({ domain, className = "" }: { domain: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return <GlobeIcon size={14} className={`shrink-0 text-fog ${className}`} />;
  return (
    <img
      src={faviconUrl(domain)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-4 w-4 shrink-0 rounded-[3px] ${className}`}
    />
  );
}

export function SiteCard({
  site,
  index,
  onOpen,
  onDelete,
}: {
  site: SiteItem;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Reveal delay={(index % 3) * 70}>
      <article className="group relative overflow-hidden rounded-lg border border-line bg-pine shadow-lg shadow-black/30 transition-all duration-300 hover:-translate-y-1.5 hover:border-teal/50 hover:shadow-2xl hover:shadow-black/50">
        <button onClick={onOpen} className="block w-full text-left">
          {/* sahte tarayıcı çerçevesi */}
          <div className="flex items-center gap-2 border-b border-line bg-moss px-3 py-2">
            <span className="flex gap-1.5">
              <i className="h-2.5 w-2.5 rounded-full bg-clay/70" />
              <i className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <i className="h-2.5 w-2.5 rounded-full bg-teal/70" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-ink px-2.5 py-1 text-xs text-fog">
              <Favicon domain={site.domain} />
              <span className="truncate">{site.domain}</span>
            </span>
          </div>

          {/* ekran görüntüsü */}
          <div className="relative aspect-[16/10] overflow-hidden bg-ink">
            {!failed ? (
              <img
                src={screenshotUrl(site.url)}
                alt={`${site.title} ekran görüntüsü`}
                loading="lazy"
                onLoad={() => setLoaded(true)}
                onError={() => setFailed(true)}
                className={`h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.045] ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : (
              <div
                className="grid h-full w-full place-items-center"
                style={{
                  background:
                    "linear-gradient(150deg, rgba(85,160,142,.16), rgba(18,26,22,.4))",
                }}
              >
                <span className="font-display text-6xl font-black text-cream/15">
                  {site.domain.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {!loaded && !failed && (
              <div className="shimmer absolute inset-0 flex items-center justify-center">
                <span className="flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] font-semibold text-fog">
                  <SpinnerIcon size={12} /> önizleme çekiliyor…
                </span>
              </div>
            )}
            <span className="absolute inset-0 grid place-items-center bg-ink/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="flex items-center gap-2 rounded-full bg-teal px-4 py-1.5 text-xs font-bold text-ink shadow-lg">
                <EyeIcon size={14} /> Önizle
              </span>
            </span>
          </div>

          {/* bilgi */}
          <div className="px-4 py-3.5">
            <h3 className="font-display text-[15px] font-semibold leading-tight text-cream line-clamp-1 transition-colors group-hover:text-teal">
              {site.title}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-xs text-fog">
              {site.provider && <span>{site.provider}</span>}
              {site.provider && <span className="text-line">•</span>}
              <span>{fmtDate(site.addedAt)}</span>
              {site.note && (
                <>
                  <span className="text-line">•</span>
                  <NoteIcon size={12} className="text-amber" />
                </>
              )}
            </p>
          </div>
        </button>

        <a
          href={site.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label={`${site.domain} adresini yeni sekmede aç`}
          className="absolute right-2.5 top-2.5 z-10 rounded-md border border-line bg-ink/85 p-1.5 text-fog transition hover:border-teal/60 hover:text-teal active:scale-90"
        >
          <ExternalIcon size={13} />
        </a>
        <button
          onClick={onDelete}
          aria-label={`${trunc(site.title)} sitesini sil`}
          className="absolute right-11 top-2.5 z-10 rounded-md border border-line bg-ink/85 p-1.5 text-fog opacity-0 transition hover:border-clay/60 hover:text-clay focus-visible:opacity-100 group-hover:opacity-100 active:scale-90"
        >
          <TrashIcon size={13} />
        </button>
      </article>
    </Reveal>
  );
}

/* ---------------- site modalı ---------------- */

export function SiteModal({
  site,
  onClose,
  onDelete,
  onNote,
  locked = false,
}: {
  site: SiteItem;
  onClose: () => void;
  onDelete: () => void;
  onNote: (note: string) => void;
  locked?: boolean;
}) {
  const [mode, setMode] = useState<"live" | "shot">("live");
  const [note, setNote] = useState(site.note ?? "");
  const [saved, setSaved] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);

  const saveNote = () => {
    if (note !== (site.note ?? "")) {
      onNote(note);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-pine shadow-2xl shadow-black/60">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <Favicon domain={site.domain} className="!h-5 !w-5" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-bold leading-tight text-cream">
            {site.title}
          </h2>
          <p className="truncate text-xs text-fog">{site.url}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-ink p-1">
          {(["live", "shot"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition active:scale-95 ${
                mode === m ? "bg-teal text-ink" : "text-fog hover:text-cream"
              }`}
            >
              {m === "live" ? "Canlı" : "Görsel"}
            </button>
          ))}
        </div>
        <a
          href={site.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-bold text-fog transition hover:border-teal/60 hover:text-teal active:scale-95"
        >
          <ExternalIcon size={13} /> Yeni sekme
        </a>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="rounded-md p-1.5 text-fog transition hover:bg-moss hover:text-cream active:scale-90"
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="bg-ink/60 p-4">
        {mode === "live" ? (
          <div>
            <div className="overflow-hidden rounded-lg border border-line bg-white">
              <iframe
                src={site.url}
                title={site.title}
                className="h-[56vh] w-full bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                referrerPolicy="no-referrer"
                onError={() => setIframeFailed(true)}
              />
            </div>
            <p className="mt-2.5 text-center text-[11px] text-fog">
              Sayfa boş mu göründü? Bazı siteler gömülmeyi (iframe) engeller —{" "}
              <button onClick={() => setMode("shot")} className="font-bold text-teal underline-offset-2 hover:underline">
                Görsel önizlemeye geç
              </button>
              .
            </p>
            {iframeFailed && (
              <p className="mt-1 text-center text-[11px] text-clay">
                iframe yüklenemedi; Görsel sekmesini dene.
              </p>
            )}
          </div>
        ) : (
          <div className="max-h-[62vh] overflow-y-auto rounded-lg border border-line">
            <img
              src={screenshotUrl(site.url, 1400, 0)}
              alt={`${site.title} tam sayfa ekran görüntüsü`}
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-fog">
            <PencilIcon size={11} /> Not
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
                : "Bu site hakkında notun… (hangi proje, hangi stack?)"
            }
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-ink p-3 text-sm text-cream placeholder:text-fog/50 transition focus:border-teal/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-xs text-fog">Eklenme: {fmtDate(site.addedAt)}</p>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-md border border-clay/40 px-3 py-1.5 text-xs font-bold text-clay transition hover:bg-clay hover:text-ink active:scale-95"
          >
            <TrashIcon size={13} /> Kataloğdan sil
          </button>
        </div>
      </div>
    </div>
  );
}
