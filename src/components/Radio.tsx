import { useEffect, useRef, useState } from "react";
import {
  ListIcon,
  LockIcon,
  MusicIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  VolumeIcon,
  VolumeXIcon,
  XIcon,
} from "../icons";

/* ----- YouTube IFrame API yükleyici (tek sefer) ----- */
let ytPromise: Promise<YTNamespace> | null = null;
function loadYT(): Promise<YTNamespace> {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });
  return ytPromise;
}

const LS_ENABLED = "raf-radio-enabled";
const LS_VOLUME = "raf-radio-volume";
const LS_MUTED = "raf-radio-muted";

function readPref(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sessiz */
  }
}

export interface RadioPlayerProps {
  playlistId: string | null;
  locked: boolean;
  onSavePlaylist: (id: string) => void;
  onLockedEdit: () => void;
}

export function RadioPlayer({
  playlistId,
  locked,
  onSavePlaylist,
  onLockedEdit,
}: RadioPlayerProps) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(() => readPref(LS_ENABLED, "1") === "1");
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(() => {
    const v = Number(readPref(LS_VOLUME, "70"));
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 70;
  });
  const [muted, setMuted] = useState(() => readPref(LS_MUTED, "0") === "1");
  const [now, setNow] = useState<{ title?: string; author?: string }>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const boxRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const startedByGesture = useRef(false);

  const hasList = Boolean(playlistId);
  const active = hasList && enabled;

  /* ----- oynatıcıyı kur / yık ----- */
  useEffect(() => {
    if (!active) {
      setReady(false);
      setPlaying(false);
      return;
    }
    let cancelled = false;
    const mount = document.createElement("div");
    boxRef.current?.appendChild(mount);
    loadYT().then((YT) => {
      if (cancelled) return;
      const player = new YT.Player(mount, {
        width: "220",
        height: "124",
        playerVars: {
          listType: "playlist",
          list: playlistId as string,
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            playerRef.current = e.target;
            setReady(true);
            try {
              e.target.setVolume(volume);
              if (muted) e.target.mute();
              e.target.playVideo();
            } catch {
              /* bazı tarayıcılar jest bekler — aşağıdaki dinleyici devralır */
            }
          },
          onStateChange: (e) => {
            if (cancelled) return;
            const st = e.data as number;
            setPlaying(st === 1);
            try {
              const d = e.target.getVideoData();
              if (d?.title) setNow({ title: d.title, author: d.author });
            } catch {
              /* yut */
            }
          },
        },
      });
      void player;
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* yut */
      }
      playerRef.current = null;
      mount.remove();
    };
    // volume/muted bilinçli olarak bağımlılık dışında — oynatıcıyı yeniden kurmasın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, playlistId]);

  /* ----- ilk kullanıcı jestinde başlat (tarayıcı otomatik-ses politikası) ----- */
  useEffect(() => {
    if (!active || startedByGesture.current) return;
    const tryStart = () => {
      const p = playerRef.current;
      if (!p) return;
      try {
        if (p.getPlayerState() !== 1) p.playVideo();
        startedByGesture.current = true;
        cleanup();
      } catch {
        /* tekrar dene */
      }
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", tryStart);
      window.removeEventListener("keydown", tryStart);
    };
    window.addEventListener("pointerdown", tryStart);
    window.addEventListener("keydown", tryStart);
    return cleanup;
  }, [active, ready]);

  /* ----- şarkı adını ara sıra tazele (liste ilerledikçe) ----- */
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      try {
        const d = playerRef.current?.getVideoData();
        if (d?.title) setNow({ title: d.title, author: d.author });
      } catch {
        /* yut */
      }
    }, 4000);
    return () => window.clearInterval(t);
  }, [active]);

  /* ----- denetimler ----- */
  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    try {
      if (p.getPlayerState() === 1) p.pauseVideo();
      else p.playVideo();
    } catch {
      /* yut */
    }
  };
  const next = () => {
    try {
      playerRef.current?.nextVideo();
    } catch {
      /* yut */
    }
  };
  const changeVolume = (v: number) => {
    setVolume(v);
    writePref(LS_VOLUME, String(v));
    try {
      playerRef.current?.setVolume(v);
      if (v > 0 && muted) toggleMute();
    } catch {
      /* yut */
    }
  };
  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    writePref(LS_MUTED, nextMuted ? "1" : "0");
    try {
      if (nextMuted) playerRef.current?.mute();
      else playerRef.current?.unMute();
    } catch {
      /* yut */
    }
  };
  const setEnabledAndStore = (v: boolean) => {
    setEnabled(v);
    writePref(LS_ENABLED, v ? "1" : "0");
    if (!v) startedByGesture.current = false;
  };

  const saveDraft = () => {
    const id = draft.trim();
    if (!id) return;
    onSavePlaylist(id);
    setEditing(false);
    setDraft("");
  };

  const trackLabel = now.title
    ? `${now.title}${now.author ? " — " + now.author : ""}`
    : hasList
      ? "Raf Radyo çalıyor…"
      : "Playlist bekleniyor";

  return (
    <>
      {/* gizli oynatıcı taşıyıcısı */}
      <div
        ref={boxRef}
        aria-hidden
        className="pointer-events-none fixed bottom-0 right-0 z-0 h-px w-px overflow-hidden opacity-0"
      />

      {/* açılır panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-40 w-[300px] overflow-hidden rounded-xl border border-line bg-pine shadow-2xl shadow-black/70 modal-pop">
          <div className="wood px-4 py-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MusicIcon size={15} className="text-ink" />
                <span className="font-display text-sm font-black tracking-tight text-ink">
                  Raf Radyo
                </span>
              </span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Radyoyu kapat"
                className="rounded-md p-1 text-ink/70 transition hover:bg-ink/10 hover:text-ink active:scale-90"
              >
                <XIcon size={14} />
              </button>
            </div>
          </div>

          <div className="p-4">
            {/* akan şarkı adı */}
            <div className="relative h-6 overflow-hidden rounded-md border border-line bg-ink">
              <div className="marquee-track absolute left-0 top-0 flex h-full w-max items-center whitespace-nowrap px-3 text-[12px] font-semibold text-amber">
                <span className="pr-12">{trackLabel}</span>
                <span className="pr-12">{trackLabel}</span>
              </div>
            </div>

            {/* ekolayzer + durum */}
            <div className="mt-3 flex items-end justify-between">
              <div className="flex h-6 items-end gap-[3px]">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`eqbar w-[5px] rounded-sm bg-teal ${playing ? "playing" : ""}`}
                    style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-fog">
                {playing ? "çalıyor" : ready ? "durakladı" : active ? "hazırlanıyor" : "kapalı"}
              </span>
            </div>

            {/* kontroller */}
            <div className="mt-3 flex items-center gap-2.5">
              <button
                onClick={togglePlay}
                disabled={!active || !ready}
                aria-label={playing ? "Duraklat" : "Çal"}
                className="grid h-10 w-10 place-items-center rounded-full bg-amber text-ink shadow-md shadow-amber/25 transition hover:bg-ambersoft active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
              </button>
              <button
                onClick={next}
                disabled={!active || !ready}
                aria-label="Sonraki parça"
                className="grid h-9 w-9 place-items-center rounded-full border border-line text-fog transition hover:border-amber/60 hover:text-amber active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <NextIcon size={14} />
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  disabled={!active}
                  aria-label={muted ? "Sesi aç" : "Sesi kapat"}
                  className="grid h-8 w-8 place-items-center rounded-md text-fog transition hover:text-cream active:scale-90 disabled:opacity-40"
                >
                  {muted || volume === 0 ? <VolumeXIcon size={15} /> : <VolumeIcon size={15} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  disabled={!active}
                  aria-label="Ses düzeyi"
                  className="h-1 w-16 cursor-pointer accent-amber disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
            </div>

            {/* aç/kapa + liste */}
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3">
              <button
                onClick={() => setEnabledAndStore(!enabled)}
                className={`rounded-md border px-2.5 py-1.5 text-[11px] font-bold transition active:scale-95 ${
                  enabled
                    ? "border-teal/60 bg-teal/10 text-teal hover:bg-teal/20"
                    : "border-line text-fog hover:border-clay/60 hover:text-clay"
                }`}
              >
                {enabled ? "Girişte otomatik çal: açık" : "Girişte otomatik çal: kapalı"}
              </button>

              {locked ? (
                <button
                  onClick={onLockedEdit}
                  aria-label="Listeyi değiştirmek için yönetici doğrulaması"
                  title="Listeyi değiştirmek için yönetici doğrulaması"
                  className="grid h-7 w-7 place-items-center rounded-md border border-line text-fog transition hover:border-amber/60 hover:text-amber active:scale-90"
                >
                  <LockIcon size={13} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditing((v) => !v);
                    setDraft(playlistId ?? "");
                  }}
                  aria-label="Playlist'i değiştir"
                  title="Playlist'i değiştir"
                  className="grid h-7 w-7 place-items-center rounded-md border border-line text-fog transition hover:border-amber/60 hover:text-amber active:scale-90"
                >
                  <ListIcon size={13} />
                </button>
              )}
            </div>

            {/* liste düzenleyici */}
            {editing && !locked && (
              <div className="mt-3 rounded-lg border border-line bg-ink p-2.5">
                <label
                  htmlFor="playlist-id"
                  className="text-[10px] font-bold uppercase tracking-[0.16em] text-fog"
                >
                  YouTube playlist ID (list=…)
                </label>
                <div className="mt-1.5 flex gap-1.5">
                  <input
                    id="playlist-id"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="PLabc123…"
                    className="w-full rounded-md border border-line bg-pine px-2 py-1.5 text-xs text-cream placeholder:text-fog/50 focus:border-amber/60 focus:outline-none"
                  />
                  <button
                    onClick={saveDraft}
                    disabled={!draft.trim()}
                    className="shrink-0 rounded-md bg-amber px-2.5 py-1.5 text-xs font-bold text-ink transition hover:bg-ambersoft active:scale-95 disabled:opacity-40"
                  >
                    Kaydet
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-fog/70">
                  Ortak listeye kaydedilir — tüm ziyaretçilerde aynı liste çalar.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* toplanmış düğme: dönen plak */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Radyo panelini kapat" : "Radyo panelini aç"}
        title="Raf Radyo"
        className="group fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border-2 border-amber/70 bg-ink shadow-xl shadow-black/60 transition hover:scale-105 hover:border-ambersoft active:scale-95"
      >
        {/* plak */}
        <span className={`vinyl relative block h-9 w-9 rounded-full ${playing ? "playing" : ""}`}>
          <span className="absolute inset-0 rounded-full bg-[repeating-radial-gradient(circle_at_center,#18241e_0,#18241e_2px,#0c1210_2px,#0c1210_4px)]" />
          <span className="absolute inset-[30%] rounded-full bg-amber" />
          <span className="absolute inset-[46%] rounded-full bg-ink" />
        </span>
        {/* mini ekolayzer */}
        <span className="absolute -left-1 bottom-1 flex h-3.5 items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`eqbar w-[3px] rounded-sm bg-teal ${playing ? "playing" : ""}`}
              style={{ height: "100%", animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
        {/* rozet */}
        {hasList && enabled && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-ink bg-teal" />
        )}
      </button>
    </>
  );
}
