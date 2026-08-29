import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { BookItem, SiteItem, Tab, ToastMsg } from "./types";
import { LS_BOOKS, LS_SITES, fmtNum, trunc } from "./types";
import { useCountUp } from "./hooks";
import {
  loadCatalog,
  localBooks,
  localSites,
  saveCatalog,
  writeLocal,
} from "./net";
import {
  SEED_QUERIES,
  SEED_SITES,
  domainOf,
  fetchSiteMeta,
  fetchVolume,
  parseBookInput,
  searchVolumes,
} from "./api";
import {
  BookIcon,
  CheckIcon,
  CloudIcon,
  CloudOffIcon,
  GlobeIcon,
  InstallIcon,
  LockIcon,
  LogoMark,
  SearchIcon,
  SparkIcon,
  SpinnerIcon,
  StarIcon,
  UnlockIcon,
  XIcon,
} from "./icons";
import { EmptyGlobeArt, EmptyShelfArt, Modal, Reveal, ToastHost } from "./components/Shared";
import {
  AddBookBar,
  BookCard,
  BookCover,
  BookModal,
  ManualBookModal,
} from "./components/BookBits";
import { AddSiteBar, SiteCard, SiteModal } from "./components/SiteBits";

type ModalState =
  | { kind: "book"; id: string }
  | { kind: "site"; id: string }
  | { kind: "manual" }
  | null;

/* ---------- istatistik ---------- */

function Stat({
  value,
  label,
  decimals = 0,
}: {
  value: number;
  label: string;
  decimals?: number;
}) {
  const v = useCountUp(value);
  const display =
    decimals > 0
      ? v.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
      : fmtNum(Math.round(v));
  return (
    <div>
      <p className="font-display text-[34px] font-black leading-none tracking-tight text-cream tabular-nums">
        {display}
      </p>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-fog">
        {label}
      </p>
    </div>
  );
}

/* ---------- toz zerreleri ---------- */

const MOTES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3 + 3) % 98}%`,
  top: `${16 + ((i * 13) % 72)}%`,
  size: 2 + (i % 3),
  dur: `${9 + (i % 8) * 1.8}s`,
  delay: `${-(i * 1.9)}s`,
}));

function Motes() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {MOTES.map((m, i) => (
        <span
          key={i}
          className="mote"
          style={{
            left: m.left,
            top: m.top,
            width: m.size,
            height: m.size,
            animationDuration: m.dur,
            animationDelay: m.delay,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- yönetici koruması ---------- */

const ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD ?? "").trim();

function AuthPanel({
  action,
  onUnlock,
  onClose,
}: {
  action: string;
  onUnlock: (key: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(0);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value) return;
    if (value === ADMIN_PASSWORD) onUnlock(value);
    else {
      setWrong((w) => w + 1);
      setValue("");
    }
  };

  return (
    <div
      key={wrong}
      className={`w-full max-w-md rounded-xl border border-line bg-pine p-7 shadow-2xl shadow-black/60 ${
        wrong > 0 ? "shake" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 -rotate-3 place-items-center rounded-xl bg-amber text-ink shadow-lg shadow-amber/25">
          <LockIcon size={19} />
        </span>
        <div>
          <h2 className="font-display text-lg font-black leading-tight text-cream">
            Yönetici doğrulaması
          </h2>
          <p className="text-xs text-fog">
            “{action}” işlemi şifre ister
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Kapat"
          className="ml-auto rounded-md p-1.5 text-fog transition hover:bg-moss hover:text-cream active:scale-90"
        >
          <XIcon size={16} />
        </button>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-fog">
        Katalog herkesin gezmesine açık; yalnızca{" "}
        <strong className="text-cream">ekleme ve silme</strong> yönetici şifresi ister.
      </p>

      <form onSubmit={submit} className="mt-4">
        <label
          htmlFor="admin-pw"
          className="text-[10px] font-bold uppercase tracking-[0.18em] text-fog"
        >
          Yönetici şifresi
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="admin-pw"
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm text-cream placeholder:text-fog/50 transition focus:border-amber/60 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-amber px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ambersoft active:scale-95"
          >
            Doğrula
          </button>
        </div>
        {wrong > 0 && (
          <p className="mt-2.5 text-xs font-semibold text-clay">
            Şifre yanlış — tekrar dene. ({wrong}. deneme)
          </p>
        )}
      </form>

      
    </div>
  );
}

/* ---------- uygulama ---------- */

export default function App() {
  const [tab, setTab] = useState<Tab>("books");
  // Katalog önce yerel önbellekten anında açılır, sonra sunucudan tazelenir.
  const [books, setBooks] = useState<BookItem[]>(localBooks);
  const [sites, setSites] = useState<SiteItem[]>(localSites);

  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  /* ----- bulut senkronizasyonu ----- */
  type SyncState =
    | "loading"
    | "local"
    | "syncing"
    | "synced"
    | "error";
  const [sync, setSync] = useState<SyncState>("loading");
  const adminKeyRef = useRef("");
  const hydratedRef = useRef(false);
  const justLoadedRef = useRef(false);

  const [bookInput, setBookInput] = useState("");
  const [bookBusy, setBookBusy] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);
  const [bookResults, setBookResults] = useState<BookItem[]>([]);

  const [siteInput, setSiteInput] = useState("");
  const [siteBusy, setSiteBusy] = useState(false);

  const [bookQuery, setBookQuery] = useState("");
  const [siteQuery, setSiteQuery] = useState("");
  const [sort, setSort] = useState<"new" | "alpha" | "rating">("new");

  const [modal, setModal] = useState<ModalState>(null);
  const [seeding, setSeeding] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  // Kilit oturumluktur: sayfa yenilenince şifre yeniden girilir,
  // böylece yazma anahtarı hiçbir zaman kalıcı olarak saklanmaz.
  const [unlocked, setUnlocked] = useState(() => ADMIN_PASSWORD.length === 0);
  const [authAction, setAuthAction] = useState<string | null>(null);
  const pendingFn = useRef<(() => void) | null>(null);
  const isLocked = ADMIN_PASSWORD.length > 0 && !unlocked;

  /* ----- bildirimler ----- */
  const dismissToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const push = (
    msg: string,
    kind: ToastMsg["kind"] = "success",
    action?: { label: string; fn: () => void }
  ) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-3), { id, msg, kind, actionLabel: action?.label, onAction: action?.fn }]);
    window.setTimeout(() => dismissToast(id), 5000);
  };

  /* ----- yönetici koruması ----- */
  const openAuth = (action: string, fn?: () => void) => {
    pendingFn.current = fn ?? null;
    setAuthAction(action);
  };
  const unlock = (key: string) => {
    adminKeyRef.current = key;
    setUnlocked(true);
    setAuthAction(null);
    push("Yönetici doğrulandı — değişiklikler açık.", "success");
    const fn = pendingFn.current;
    pendingFn.current = null;
    fn?.();
  };
  const lock = () => {
    adminKeyRef.current = "";
    setUnlocked(false);
    push("Yönetici oturumu kilitlendi — katalog salt gezilebilir.", "info");
  };
  /** Değiştirici işlemler için kapı: kilitliyse şifre modalını açar, doğrulanınca işlemi sürdürür. */
  const gate = (action: string, fn: () => void) => {
    if (unlocked) fn();
    else openAuth(action, fn);
  };

  /* ----- buluta yazma ----- */
  const persist = async (b: BookItem[], s: SiteItem[]) => {
    setSync("syncing");
    const res = await saveCatalog(b, s, adminKeyRef.current);
    if (res === "ok") {
      setSync("synced");
    } else if (res === "unauthorized") {
      setSync("error");
      push("Sunucu yönetici doğrulamasını reddetti — değişiklik kaydedilmedi.", "error");
      lock();
    } else {
      setSync("error");
    }
  };

  // Sunucudan yükle: açılışta paylaşılan kataloğu çek, yerel önbelleği tazele.
  // Boş bir sunucu, zaten dolu olan yerel kataloğu ezmesin diye korunur.
  useEffect(() => {
    let alive = true;
    loadCatalog().then(({ data, fromServer }) => {
      if (!alive) return;
      if (data && fromServer) {
        const serverHasData = data.books.length > 0 || data.sites.length > 0;
        const localHasData = localBooks().length > 0 || localSites().length > 0;
        if (serverHasData || !localHasData) {
          justLoadedRef.current = true;
          setBooks(data.books);
          setSites(data.sites);
        }
      }
      hydratedRef.current = true;
      setSync(fromServer ? "synced" : "local");
    });
    return () => {
      alive = false;
    };
  }, []);

  // Değişiklikleri önce yerelde önbelleğe al, sonra buluta yaz (gecikmeli).
  useEffect(() => {
    writeLocal(LS_BOOKS, books);
    writeLocal(LS_SITES, sites);
    if (!hydratedRef.current) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      void persist(books, sites);
    }, 600);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books, sites]);

  /* ----- PWA kurulumu ----- */
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.("(display-mode: standalone)").matches ?? false
  );
  useEffect(() => {
    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
      push("Raf cihazına yüklendi — ana ekrandan açabilirsin.", "success");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") {
      setInstallEvt(null);
      push("Yükleme başladı…", "success");
    }
  };

  /* ----- kitap işlemleri ----- */
  const addBook = (b: BookItem): boolean => {
    if (books.some((x) => x.id === b.id)) {
      push("Bu kitap zaten rafında.", "info");
      return false;
    }
    setBooks((l) => [b, ...l]);
    push(`“${trunc(b.title)}” rafa eklendi.`, "success");
    return true;
  };

  const removeBook = (id: string) => {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    setBooks((l) => l.filter((x) => x.id !== id));
    setModal(null);
    push(`“${trunc(b.title)}” raftan indirildi.`, "info", {
      label: "Geri al",
      fn: () => setBooks((l) => [b, ...l]),
    });
  };

  const patchBook = (id: string, patch: Partial<BookItem>) =>
    setBooks((l) => l.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const toggleFeature = (id: string) => {
    const b = books.find((x) => x.id === id);
    if (!b) return;
    const on = !b.featured;
    patchBook(id, { featured: on });
    push(
      on ? `“${trunc(b.title)}” vitrine kondu.` : `“${trunc(b.title)}” vitrinden indirildi.`,
      "info"
    );
  };

  const suggestShowcase = () => {
    const top = [...books]
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.addedAt - a.addedAt)
      .slice(0, 6)
      .filter((b) => !b.featured);
    if (!top.length) {
      push("Vitrine konacak yeni kitap kalmadı.", "info");
      return;
    }
    setBooks((l) => l.map((b) => (top.some((t) => t.id === b.id) ? { ...b, featured: true } : b)));
    push(`${top.length} kitap vitrine kondu.`, "success");
  };

  const handleBookSubmit = async () => {
    const text = bookInput.trim();
    if (!text || bookBusy) return;
    setBookBusy(true);
    setBookError(null);
    setBookResults([]);
    try {
      const parsed = parseBookInput(text);
      if (parsed.type === "id") {
        const v = await fetchVolume(parsed.id);
        if (v) {
          addBook({
            ...v,
            playUrl: v.playUrl ?? `https://play.google.com/store/books/details?id=${parsed.id}`,
            source: "play",
          });
          setBookInput("");
        } else {
          setBookError("Bağlantı çözülemedi — Google Books bu kimliği tanımadı.");
        }
      } else {
        const res = await searchVolumes(parsed.q, 6);
        if (res.length) {
          setBookResults(res);
        } else {
          setBookError("Arama sonuç vermedi. Yazımı kontrol et ya da elle ekle.");
        }
      }
    } catch {
      setBookError("Ağ hatası — bağlantını kontrol edip tekrar dene.");
    } finally {
      setBookBusy(false);
    }
  };

  /* ----- site işlemleri ----- */
  const addSite = (url: string) => {
    const domain = domainOf(url);
    if (sites.some((s) => s.domain === domain)) {
      push(`${domain} zaten kataloğunda.`, "info");
      setSiteInput("");
      return;
    }
    const item: SiteItem = {
      id: `s-${Date.now()}`,
      url,
      domain,
      title: domain,
      addedAt: Date.now(),
    };
    setSites((l) => [item, ...l]);
    setSiteInput("");
    push(`${domain} eklendi — önizleme hazırlanıyor.`, "success");
    fetchSiteMeta(url).then((m) => {
      if (m.title) {
        setSites((l) =>
          l.map((s) =>
            s.id === item.id ? { ...s, title: m.title!, provider: m.provider ?? s.provider } : s
          )
        );
      }
    });
  };

  const removeSite = (id: string) => {
    const s = sites.find((x) => x.id === id);
    if (!s) return;
    setSites((l) => l.filter((x) => x.id !== id));
    setModal(null);
    push(`${s.domain} katalogdan silindi.`, "info", {
      label: "Geri al",
      fn: () => setSites((l) => [s, ...l]),
    });
  };

  const patchSite = (id: string, patch: Partial<SiteItem>) =>
    setSites((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  /* ----- örnek veri ----- */
  const seed = async () => {
    if (seeding) return;
    setSeeding(true);
    push("Örnek katalog hazırlanıyor…", "info");
    try {
      const found: BookItem[] = [];
      for (const q of SEED_QUERIES) {
        try {
          const r = await searchVolumes(q, 1);
          if (r[0]) found.push({ ...r[0], source: "search" });
        } catch {
          /* tek sorgu başarısız olsa da devam */
        }
      }
      if (found.length) {
        setBooks((l) => {
          const ids = new Set(l.map((x) => x.id));
          return [...found.filter((f) => !ids.has(f.id)), ...l];
        });
      }
      const seedSites: SiteItem[] = SEED_SITES.map((s, i) => ({
        id: `seed-${Date.now()}-${i}`,
        url: s.url,
        domain: domainOf(s.url),
        title: s.title,
        addedAt: Date.now() - i * 60_000,
      }));
      setSites((l) => {
        const urls = new Set(l.map((x) => x.domain));
        return [...seedSites.filter((s) => !urls.has(s.domain)), ...l];
      });
      push("Örnek katalog yüklendi — raflar doldu!", "success");
    } finally {
      setSeeding(false);
    }
  };

  const resetAll = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      window.setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    setBooks([]);
    setSites([]);
    setConfirmReset(false);
    push("Katalog sıfırlandı.", "info");
  };

  /* ----- türetilmiş listeler ----- */
  const shownBooks = useMemo(() => {
    const q = bookQuery.trim().toLocaleLowerCase("tr");
    let l = books.filter(
      (b) =>
        !q ||
        b.title.toLocaleLowerCase("tr").includes(q) ||
        b.authors.some((a) => a.toLocaleLowerCase("tr").includes(q))
    );
    if (sort === "alpha") l = [...l].sort((a, b) => a.title.localeCompare(b.title, "tr"));
    else if (sort === "rating") l = [...l].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else l = [...l].sort((a, b) => b.addedAt - a.addedAt);
    return l;
  }, [books, bookQuery, sort]);

  const shownSites = useMemo(() => {
    const q = siteQuery.trim().toLocaleLowerCase("tr");
    return sites.filter(
      (s) =>
        !q ||
        s.title.toLocaleLowerCase("tr").includes(q) ||
        s.domain.toLocaleLowerCase("tr").includes(q) ||
        (s.provider ?? "").toLocaleLowerCase("tr").includes(q)
    );
  }, [sites, siteQuery]);

  const showcase = useMemo(
    () =>
      books
        .filter((b) => b.featured)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.addedAt - a.addedAt),
    [books]
  );

  const totalPages = useMemo(
    () => books.reduce((acc, b) => acc + (b.pageCount ?? 0), 0),
    [books]
  );
  const avgRating = useMemo(() => {
    const r = books.filter((b) => b.rating);
    if (!r.length) return 0;
    return r.reduce((a, b) => a + (b.rating ?? 0), 0) / r.length;
  }, [books]);
  const catCount = useMemo(
    () => new Set(books.flatMap((b) => b.categories ?? [])).size,
    [books]
  );
  const notedSites = useMemo(() => sites.filter((s) => s.note?.trim()).length, [sites]);

  const modalBook =
    modal?.kind === "book" ? books.find((b) => b.id === modal.id) : undefined;
  const modalSite =
    modal?.kind === "site" ? sites.find((s) => s.id === modal.id) : undefined;

  const focusInput = (id: string) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.focus();
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen">
      {/* ortam katmanları */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(1000px 700px at 88% -12%, rgba(85,160,142,.16), transparent 60%), radial-gradient(900px 620px at -8% 6%, rgba(232,163,61,.14), transparent 55%), radial-gradient(700px 500px at 50% 115%, rgba(85,160,142,.08), transparent 60%)",
          }}
        />
        <div className="noise absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(130% 95% at 50% 8%, transparent 55%, rgba(4,8,6,.6) 100%)",
          }}
        />
      </div>
      <Motes />

      {/* başlık */}
      <header className="relative z-10 mx-auto max-w-6xl px-5 pb-6 pt-9">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-5">
          <div className="flex items-center gap-3.5">
            <span className="grid h-12 w-12 -rotate-3 place-items-center rounded-xl bg-amber text-ink shadow-lg shadow-amber/25 transition-transform duration-300 hover:rotate-0 hover:scale-105">
              <LogoMark size={27} />
            </span>
            <div>
              <h1 className="font-display text-[34px] font-black leading-none tracking-tight text-cream">
                Raf
              </h1>
              <p className="mt-1 text-xs tracking-wide text-fog">
                Google Play kitaplarım & web sitelerim — tek kişilik vitrin
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* veri durumu */}
            <span
              title={
                sync === "synced"
                  ? "Katalog sunucuyla eşitlendi — herkes aynı veriyi görür"
                  : sync === "syncing"
                    ? "Değişiklikler buluta yazılıyor"
                    : sync === "local"
                      ? "Sunucuya ulaşılamadı — yerel önbellek gösteriliyor"
                      : sync === "error"
                        ? "Son değişiklik kaydedilemedi"
                        : "Katalog yükleniyor"
              }
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                sync === "synced"
                  ? "border-teal/50 text-teal"
                  : sync === "syncing" || sync === "loading"
                    ? "border-line text-fog"
                    : sync === "local"
                      ? "border-amber/50 text-amber"
                      : "border-clay/60 text-clay"
              }`}
            >
              {sync === "synced" ? (
                <CheckIcon size={12} />
              ) : sync === "syncing" || sync === "loading" ? (
                <SpinnerIcon size={12} />
              ) : sync === "local" ? (
                <CloudOffIcon size={12} />
              ) : (
                <CloudIcon size={12} />
              )}
              {sync === "synced"
                ? "Eşitlendi"
                : sync === "syncing"
                  ? "Eşitleniyor"
                  : sync === "loading"
                    ? "Yükleniyor"
                    : sync === "local"
                      ? "Yerel mod"
                      : "Kaydedilemedi"}
            </span>

            {installEvt && !installed && (
              <button
                onClick={handleInstall}
                title="Raf'ı cihazına uygulama olarak yükle"
                className="flex items-center gap-1.5 rounded-full border border-teal/60 bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal transition hover:bg-teal/20 active:scale-95"
              >
                <InstallIcon size={12} />
                Uygulamayı yükle
              </button>
            )}
            {ADMIN_PASSWORD && (
              <button
                onClick={() => (isLocked ? openAuth("yönetici girişi") : lock())}
                title={
                  isLocked
                    ? "Yönetici olarak doğrulan"
                    : "Yönetici oturumunu kilitle"
                }
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                  isLocked
                    ? "border-line text-fog hover:border-amber/60 hover:text-amber"
                    : "border-amber/60 bg-amber/10 text-amber hover:bg-amber/20"
                }`}
              >
                {isLocked ? <LockIcon size={12} /> : <UnlockIcon size={12} />}
                {isLocked ? "Ziyaretçi" : "Yönetici"}
              </button>
            )}
          <nav aria-label="Sekmeler" className="relative grid w-[300px] grid-cols-2 rounded-full border border-line bg-pine p-1">
            <span
              aria-hidden
              className={`absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-amber transition-transform duration-300 ease-out ${
                tab === "sites" ? "translate-x-full" : ""
              }`}
            />
            <button
              onClick={() => setTab("books")}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-2 text-sm font-bold transition-colors ${
                tab === "books" ? "text-ink" : "text-fog hover:text-cream"
              }`}
            >
              <BookIcon size={15} />
              Kitaplar
              <span
                className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                  tab === "books" ? "bg-ink/15 text-ink" : "bg-moss text-fog"
                }`}
              >
                {books.length}
              </span>
            </button>
            <button
              onClick={() => setTab("sites")}
              className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-2 text-sm font-bold transition-colors ${
                tab === "sites" ? "text-ink" : "text-fog hover:text-cream"
              }`}
            >
              <GlobeIcon size={15} />
              Siteler
              <span
                className={`rounded-full px-1.5 py-px text-[10px] tabular-nums ${
                  tab === "sites" ? "bg-ink/15 text-ink" : "bg-moss text-fog"
                }`}
              >
                {sites.length}
              </span>
            </button>
          </nav>
          </div>
        </div>

        {/* istatistik şeridi */}
        <div className="mt-8 flex flex-wrap items-end gap-x-7 gap-y-4">
          {tab === "books" ? (
            <>
              <Stat value={books.length} label="kitap rafta" />
              <span className="hidden h-9 w-px bg-line sm:block" />
              <Stat value={totalPages} label="toplam sayfa" />
              <span className="hidden h-9 w-px bg-line sm:block" />
              <Stat value={avgRating} decimals={1} label="ortalama puan" />
              <span className="hidden h-9 w-px bg-line sm:block" />
              <Stat value={catCount} label="kategori" />
            </>
          ) : (
            <>
              <Stat value={sites.length} label="site katalogda" />
              <span className="hidden h-9 w-px bg-line sm:block" />
              <Stat value={notedSites} label="notlu site" />
              <p className="mb-1 ml-auto hidden max-w-[300px] text-right text-[11px] leading-relaxed text-fog/80 md:block">
                İpucu: bazı siteler iframe'e izin vermez — o durumda modal'daki
                <span className="font-bold text-teal"> Görsel </span>önizleme her zaman çalışır.
              </p>
            </>
          )}
        </div>
      </header>

      {/* ekleme çubuğu */}
      <div className="relative z-20">
        {tab === "books" ? (
          <AddBookBar
            value={bookInput}
            onChange={setBookInput}
            busy={bookBusy}
            error={bookError}
            results={bookResults}
            onSubmit={() => gate("kitap ekleme", handleBookSubmit)}
            onPick={(b) =>
              gate("kitap ekleme", () => {
                addBook({ ...b, source: "search" });
                setBookResults([]);
                setBookInput("");
              })
            }
            onClear={() => setBookResults([])}
            onManual={() => gate("elle ekleme", () => setModal({ kind: "manual" }))}
            locked={isLocked}
            onLocked={() => openAuth("kitap ekleme")}
          />
        ) : (
          <AddSiteBar
            value={siteInput}
            onChange={setSiteInput}
            busy={siteBusy}
            onSubmit={(url) => gate("site ekleme", () => addSite(url))}
            locked={isLocked}
            onLocked={() => openAuth("site ekleme")}
          />
        )}
      </div>

      {/* içerik */}
      <main className="relative z-10">
        {tab === "books" ? (
          books.length === 0 ? (
            <section className="mx-auto max-w-6xl px-5 pb-24 pt-12">
              <Reveal className="mx-auto max-w-xl text-center">
                <EmptyShelfArt className="mx-auto w-72 max-w-full" />
                <h2 className="mt-7 font-display text-3xl font-black text-cream">
                  Rafın şimdilik boş
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fog">
                  Google Play'deki kitabının bağlantısını yukarıya yapıştır; kapak, puan,
                  açıklama ve tüm içerik bilgisi <strong className="text-amber">tek tıkla</strong> gelir.
                  Ya da örnek katalogla hemen dene.
                </p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      isLocked ? openAuth("kitap ekleme") : focusInput("book-input")
                    }
                    className="rounded-lg bg-amber px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ambersoft active:scale-[0.97]"
                  >
                    Bağlantı yapıştır
                  </button>
                  <button
                    onClick={() => gate("örnek veri yükleme", seed)}
                    disabled={seeding}
                    className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-cream transition hover:border-amber/60 hover:text-ambersoft active:scale-[0.97] disabled:opacity-50"
                  >
                    {seeding ? <SpinnerIcon size={15} /> : <SparkIcon size={15} />}
                    Örnek katalogla dene
                  </button>
                </div>
              </Reveal>
            </section>
          ) : (
            <>
              {/* vitrin */}
              <section className="mx-auto max-w-6xl px-5 pt-9">
                <div className="mb-4 flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-2xl font-black text-cream">
                    Vitrin
                    <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.24em] text-amber">
                      benim seçtiklerim
                    </span>
                  </h2>
                  <p className="text-xs text-fog">
                    {showcase.length > 0
                      ? `${showcase.length} kitap · puana göre`
                      : "katalogdaki yıldızlardan seç"}
                  </p>
                </div>

                {showcase.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-amber/30 bg-moss/40 px-6 py-9 text-center">
                    <StarIcon size={22} className="mx-auto text-amber/70" />
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fog">
                      Vitrinin şimdilik boş. Aşağıdaki katalogda sergilemek istediğin kitapların
                      kapağındaki <strong className="text-amber">yıldıza</strong> bas — yalnızca
                      senin seçtiklerin burada durur.
                    </p>
                    <button
                      onClick={() => gate("vitrin değişikliği", suggestShowcase)}
                      className="mt-5 rounded-lg border border-amber/50 px-4 py-2 text-xs font-bold text-amber transition hover:bg-amber hover:text-ink active:scale-95"
                    >
                      Puanı en yüksek 6 kitabı vitrine koy
                    </button>
                  </div>
                ) : (
                <div className="relative pt-2">
                  <div className="flex snap-x gap-5 overflow-x-auto pb-3">
                    {showcase.map((b, i) => (
                      <button
                        key={b.id}
                        onClick={() => setModal({ kind: "book", id: b.id })}
                        className={`group w-[118px] shrink-0 snap-start transition-transform duration-300 hover:z-10 hover:scale-105 sm:w-[128px] ${
                          i % 2 === 0 ? "rotate-[1.4deg]" : "-rotate-[1.3deg]"
                        } hover:rotate-0!`}
                        aria-label={`${b.title} detayı`}
                      >
                        <span className="block aspect-[2/3] overflow-hidden rounded-md border border-line shadow-xl shadow-black/40 transition group-hover:border-amber/60 group-hover:shadow-2xl">
                          <BookCover book={b} />
                        </span>
                        <span className="mt-2 block truncate text-center font-display text-[13px] font-semibold text-cream/85 transition group-hover:text-ambersoft">
                          {b.title}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="wood h-[11px] rounded-full" />
                  <div className="mx-6 h-3 rounded-[100%] bg-black/50 blur-md" />
                </div>
                )}
              </section>

              {/* katalog */}
              <section className="mx-auto max-w-6xl px-5 pb-24 pt-10">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-black text-cream">
                    Tüm katalog{" "}
                    <span className="text-base font-semibold text-fog">
                      · {fmtNum(shownBooks.length)} kitap
                    </span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
                      <input
                        value={bookQuery}
                        onChange={(e) => setBookQuery(e.target.value)}
                        placeholder="Kitap veya yazar ara…"
                        className="w-48 rounded-lg border border-line bg-pine py-2 pl-9 pr-3 text-[13px] text-cream placeholder:text-fog/60 transition focus:border-amber/60 focus:outline-none sm:w-56"
                      />
                    </div>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as typeof sort)}
                      className="rounded-lg border border-line bg-pine px-3 py-2 text-[13px] font-semibold text-cream transition focus:border-amber/60 focus:outline-none"
                      aria-label="Sıralama"
                    >
                      <option value="new">En yeni</option>
                      <option value="alpha">İsme göre (A–Z)</option>
                      <option value="rating">Puana göre</option>
                    </select>
                  </div>
                </div>

                {shownBooks.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-fog">
                    “{bookQuery}” ile eşleşen kitap yok.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {shownBooks.map((b, i) => (
                      <BookCard
                        key={b.id}
                        book={b}
                        index={i}
                        onOpen={() => setModal({ kind: "book", id: b.id })}
                        onDelete={() => gate("kitap silme", () => removeBook(b.id))}
                        onToggleFeature={() =>
                          gate("vitrin değişikliği", () => toggleFeature(b.id))
                        }
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )
        ) : sites.length === 0 ? (
          <section className="mx-auto max-w-6xl px-5 pb-24 pt-12">
            <Reveal className="mx-auto max-w-xl text-center">
              <EmptyGlobeArt className="mx-auto w-72 max-w-full" />
              <h2 className="mt-7 font-display text-3xl font-black text-cream">
                Henüz siten yok
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-fog">
                Oluşturduğun web sitelerinin URL'lerini ekle; Raf ekran görüntüsünü çeker,
                canlı önizlemeyi hazırlar, başlığı bulur.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() =>
                    isLocked ? openAuth("site ekleme") : focusInput("site-input")
                  }
                  className="rounded-lg bg-teal px-5 py-2.5 text-sm font-bold text-ink transition hover:brightness-110 active:scale-[0.97]"
                >
                  İlk siteni ekle
                </button>
                <button
                  onClick={() => gate("örnek veri yükleme", seed)}
                  disabled={seeding}
                  className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-cream transition hover:border-teal/60 hover:text-teal active:scale-[0.97] disabled:opacity-50"
                >
                  {seeding ? <SpinnerIcon size={15} /> : <SparkIcon size={15} />}
                  Örnek sitelerle dene
                </button>
              </div>
            </Reveal>
          </section>
        ) : (
          <section className="mx-auto max-w-6xl px-5 pb-24 pt-9">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-black text-cream">
                Web vitrini{" "}
                <span className="text-base font-semibold text-fog">
                  · {fmtNum(shownSites.length)} site
                </span>
              </h2>
              <div className="relative">
                <SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
                <input
                  value={siteQuery}
                  onChange={(e) => setSiteQuery(e.target.value)}
                  placeholder="Site ara…"
                  className="w-48 rounded-lg border border-line bg-pine py-2 pl-9 pr-3 text-[13px] text-cream placeholder:text-fog/60 transition focus:border-teal/60 focus:outline-none sm:w-56"
                />
              </div>
            </div>

            {shownSites.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-5 py-10 text-center text-sm text-fog">
                “{siteQuery}” ile eşleşen site yok.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {shownSites.map((s, i) => (
                  <SiteCard
                    key={s.id}
                    site={s}
                    index={i}
                    onOpen={() => setModal({ kind: "site", id: s.id })}
                    onDelete={() => gate("site silme", () => removeSite(s.id))}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* alt bilgi */}
      <footer className="relative z-10 border-t border-line/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-fog">
          <p className="flex items-center gap-2">
            <LogoMark size={14} className="text-amber" />
            <span>
              <strong className="font-display text-cream">Raf</strong> — katalog herkese açık,
              ekleme &amp; silme şifre ister. Veriler Netlify'da saklanır, her cihazda aynıdır.
            </span>
          </p>
          {(books.length > 0 || sites.length > 0) && (
            <button
              onClick={() => gate("kataloğu sıfırlama", resetAll)}
              className={`rounded-md border px-3 py-1.5 font-semibold transition active:scale-95 ${
                confirmReset
                  ? "border-clay bg-clay text-ink"
                  : "border-line text-fog hover:border-clay/60 hover:text-clay"
              }`}
            >
              {confirmReset ? "Emin misin? Tekrar bas — her şey silinir" : "Kataloğu sıfırla"}
            </button>
          )}
        </div>
      </footer>

      {/* modallar */}
      {modal?.kind === "book" && modalBook && (
        <Modal label="Kitap detayı" onClose={() => setModal(null)}>
          <BookModal
            book={modalBook}
            onClose={() => setModal(null)}
            onDelete={() => gate("kitap silme", () => removeBook(modalBook.id))}
            onNote={(note) => patchBook(modalBook.id, { note })}
            onToggleFeature={() => gate("vitrin değişikliği", () => toggleFeature(modalBook.id))}
            locked={isLocked}
          />
        </Modal>
      )}
      {modal?.kind === "site" && modalSite && (
        <Modal label="Site önizleme" wide onClose={() => setModal(null)}>
          <SiteModal
            site={modalSite}
            onClose={() => setModal(null)}
            onDelete={() => gate("site silme", () => removeSite(modalSite.id))}
            onNote={(note) => patchSite(modalSite.id, { note })}
            locked={isLocked}
          />
        </Modal>
      )}
      {modal?.kind === "manual" && (
        <Modal label="Elle kitap ekle" onClose={() => setModal(null)}>
          <ManualBookModal
            onClose={() => setModal(null)}
            onAdd={(b) => {
              if (addBook(b)) setModal(null);
            }}
          />
        </Modal>
      )}
      {authAction && (
        <Modal label="Yönetici doğrulaması" onClose={() => setAuthAction(null)}>
          <AuthPanel
            action={authAction}
            onUnlock={unlock}
            onClose={() => setAuthAction(null)}
          />
        </Modal>
      )}

      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
