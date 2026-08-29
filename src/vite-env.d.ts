/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Yönetici şifresi — boşsa ekleme/silme koruması devre dışı kalır */
  readonly VITE_ADMIN_PASSWORD?: string;
  /** Google Books API anahtarı — boşsa anahtarsız (düşük kotalı) mod */
  readonly VITE_GOOGLE_BOOKS_API_KEY?: string;
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
