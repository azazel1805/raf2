/* Raf — service worker: uygulama kabuğu + akıllı önbellek */
const VERSION = "v1";
const SHELL_CACHE = `raf-shell-${VERSION}`;
const RUNTIME_CACHE = `raf-runtime-${VERSION}`;
const SHELL_URLS = ["/", "/manifest.webmanifest", "/icons/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* önbelleği sınırlı tut */
function trimCache(cacheName, max) {
  caches
    .open(cacheName)
    .then((cache) =>
      cache.keys().then((keys) => {
        if (keys.length > max) {
          const excess = keys.slice(0, keys.length - max);
          return Promise.all(excess.map((k) => cache.delete(k)));
        }
      })
    )
    .catch(() => {});
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  /* Gezinti: önce ağ, çevrimdışıysa önbellekteki kabuk */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put("/", copy).catch(() => {}));
          }
          return res;
        })
        .catch(() =>
          caches.match("/").then((hit) => hit || Response.error())
        )
    );
    return;
  }

  const host = url.hostname;
  const booksApi =
    host.endsWith("googleapis.com") && url.pathname.startsWith("/books/");
  const cdnAsset =
    host.endsWith("gstatic.com") ||
    host.endsWith("googleusercontent.com") ||
    host.endsWith("thum.io") ||
    host.endsWith("google.com") ||
    host.endsWith("noembed.com");

  /* Aynı kaynak (hash'li JS/CSS/görsel): stale-while-revalidate */
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          const network = fetch(req)
            .then((res) => {
              if (res && res.status === 200) {
                cache.put(req, res.clone()).catch(() => {});
                trimCache(RUNTIME_CACHE, 140);
              }
              return res;
            })
            .catch(() => hit);
          return hit || network;
        })
      )
    );
    return;
  }

  /* Google Books API: önce ağ, çevrimdışıysa önbellek */
  if (booksApi) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        fetch(req)
          .then((res) => {
            if (res && res.ok) {
              cache.put(req, res.clone()).catch(() => {});
              trimCache(RUNTIME_CACHE, 140);
            }
            return res;
          })
          .catch(() => cache.match(req))
      )
    );
    return;
  }

  /* Kapaklar, ekran görüntüleri, fontlar: önbellek öncelikli */
  if (cdnAsset) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((hit) => {
          const network = fetch(req)
            .then((res) => {
              if (res && (res.ok || res.type === "opaque")) {
                cache.put(req, res.clone()).catch(() => {});
                trimCache(RUNTIME_CACHE, 140);
              }
              return res;
            })
            .catch(() => hit);
          return hit || network;
        })
      )
    );
    return;
  }

  /* Geri kalan her şey: doğrudan ağ */
});
