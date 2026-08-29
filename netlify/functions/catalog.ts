// Raf — paylaşılan katalog API'si (Netlify Functions v2)
// GET  /api/catalog  -> { books, sites, savedAt }   (herkese açık)
// POST /api/catalog  -> yönetici anahtarı gerektirir (X-Admin-Key)
//
// Veri Netlify Blobs'da saklanır: bölgeye bağlı, kalıcı ve sunucu tarafıdır.
// Yerelde denemek için:  npx netlify dev
import { getStore } from "@netlify/blobs";

interface CatalogBody {
  books?: unknown;
  sites?: unknown;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });

export default async (req: Request) => {
  const store = getStore("raf-catalog");

  if (req.method === "GET") {
    const data = await store.get("catalog", { type: "json" }).catch(() => null);
    return json(data ?? { books: [], sites: [], savedAt: null });
  }

  if (req.method === "POST") {
    // Sunucu tarafı yönetici doğrulaması.
    // ADMIN_PASSWORD boşsa koruma kapalıdır (herkese yazma izni).
    const expected = (
      process.env.ADMIN_PASSWORD ??
      process.env.VITE_ADMIN_PASSWORD ??
      ""
    ).trim();
    const provided = (req.headers.get("x-admin-key") ?? "").trim();
    if (expected && provided !== expected) {
      return json({ error: "unauthorized" }, 403);
    }

    let body: CatalogBody;
    try {
      body = (await req.json()) as CatalogBody;
    } catch {
      return json({ error: "invalid-json" }, 400);
    }
    if (!body || !Array.isArray(body.books) || !Array.isArray(body.sites)) {
      return json({ error: "invalid-shape" }, 400);
    }

    const savedAt = Date.now();
    await store.setJSON("catalog", {
      books: body.books,
      sites: body.sites,
      savedAt,
    });
    return json({ ok: true, savedAt });
  }

  return json({ error: "method-not-allowed" }, 405);
};

export const config = {
  path: "/api/catalog",
};
