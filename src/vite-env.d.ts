/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Yönetici şifresi — boşsa ekleme/silme koruması devre dışı kalır */
  readonly VITE_ADMIN_PASSWORD?: string;
  /** Google Books API anahtarı — boşsa anahtarsız (düşük kotalı) mod */
  readonly VITE_GOOGLE_BOOKS_API_KEY?: string;
  /** YouTube playlist ID — Raf Radyo'nun varsayılan listesi (in-app ayar önceliklidir) */
  readonly VITE_YOUTUBE_PLAYLIST_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* ----- PWA kurulum olayları ----- */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt(): Promise<void>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}

/* ----- YouTube IFrame API (minimal tipler) ----- */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  nextVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getPlayerState(): number;
  getVideoData(): { title?: string; author?: string; video_id?: string };
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement | string,
    options: {
      width?: number | string;
      height?: number | string;
      playerVars?: Record<string, string | number>;
      events?: Record<string, (e: { data: unknown; target: YTPlayer }) => void>;
    }
  ) => YTPlayer;
}

interface Window {
  YT?: YTNamespace;
  onYouTubeIframeAPIReady?: () => void;
}
