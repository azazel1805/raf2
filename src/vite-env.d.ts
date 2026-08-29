/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Yönetici şifresi — boşsa kilit ekranı devre dışı kalır */
  readonly VITE_ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
