import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

/* ----- PWA: service worker kaydı ----- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* desteklenmeyen ortamlarda sessizce geç */
    });
  });
}

/* ----- iOS ana ekran ikonu: SVG'den çalışma anında PNG üret ----- */
(async () => {
  try {
    const res = await fetch("/icons/icon.svg");
    const text = await res.text();
    const blobUrl = URL.createObjectURL(
      new Blob([text], { type: "image/svg+xml" })
    );
    const img = new Image();
    img.src = blobUrl;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, 512, 512);
    const link = document.createElement("link");
    link.rel = "apple-touch-icon";
    link.href = canvas.toDataURL("image/png");
    document.head.appendChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    /* ikon üretilemezse sorun değil */
  }
})();
