#!/usr/bin/env python3
"""Genera la app instalable (PWA) de SynapLite en ./app a partir de synaplite.html.

Uso:  python3 build_app.py
La versión del caché se calcula del contenido, así las apps instaladas se actualizan solas.
"""
import hashlib
import json
import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "synaplite.html"
OUT = ROOT / "app"

BG = (26, 58, 92)        # azul profundo de Edu (#1a3a5c)
WHITE = (255, 255, 255)
DESC = "Pase de visita hospitalario: censo, signos vitales, laboratorios, VMA, infusiones, medicamentos y pendientes."


def png_bytes(w, h, rows):
    raw = b"".join(b"\x00" + bytes(r) for r in rows)
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def rbox(x, y, cx, cy, hw, hh, r):
    """Distancia con signo a un rectángulo redondeado."""
    qx, qy = abs(x - cx) - (hw - r), abs(y - cy) - (hh - r)
    return math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r


def shape(x, y, scale, rounded):
    if rounded and rbox(x, y, .5, .5, .5, .5, .22) > 0:
        return None
    gx, gy = .5 + (x - .5) / scale, .5 + (y - .5) / scale
    # cruz médica con trazo redondeado
    d = min(rbox(gx, gy, .5, .5, .11, .30, .05), rbox(gx, gy, .5, .5, .30, .11, .05))
    return WHITE if d <= 0 else BG


def make_icon(size, scale=1.0, rounded=False, ss=4):
    rows = []
    for j in range(size):
        row = []
        for i in range(size):
            acc = [0, 0, 0, 0]
            for sj in range(ss):
                for si in range(ss):
                    c = shape((i + (si + .5) / ss) / size, (j + (sj + .5) / ss) / size, scale, rounded)
                    if c:
                        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255
            a = acc[3] / (ss * ss)
            row += [round(acc[0] * 255 / acc[3]), round(acc[1] * 255 / acc[3]), round(acc[2] * 255 / acc[3]), round(a)] if a else [0, 0, 0, 0]
        rows.append(row)
    return png_bytes(size, size, rows)


HEAD_ADD = """<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
"""
SW_REGISTER = """<script>
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
</script>
"""
SW = """// Service worker de SynapLite: funciona sin internet.
const CACHE = "synaplite-{version}";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith("synaplite-") && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Responde desde el caché al instante y lo actualiza en segundo plano.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin !== self.location.origin && !isFont) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === "navigate" ? "index.html" : req;
    const hit = await cache.match(key);
    const net = fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) cache.put(key, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
"""


def main():
    OUT.mkdir(exist_ok=True)
    html = SRC.read_text(encoding="utf-8")
    assert "</head>" in html and "</body>" in html
    page = html.replace("</head>", HEAD_ADD + "</head>", 1).replace("</body>", SW_REGISTER + "</body>", 1)
    (OUT / "index.html").write_text(page, encoding="utf-8")
    for name, data in {
        "icon-192.png": make_icon(192, rounded=True),
        "icon-512.png": make_icon(512, rounded=True, ss=3),
        "icon-maskable-512.png": make_icon(512, scale=.78, ss=3),
        "apple-touch-icon.png": make_icon(180, scale=.9),
    }.items():
        (OUT / name).write_bytes(data)
    manifest = {
        "name": "SynapLite · Pase de visita", "short_name": "SynapLite", "description": DESC,
        "lang": "es-MX", "start_url": "./", "scope": "./", "id": "./", "display": "standalone",
        "orientation": "any", "background_color": "#f8f9fa", "theme_color": "#1a3a5c",
        "categories": ["medical", "productivity"],
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
            {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (OUT / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    h = hashlib.sha256(page.encode() + json.dumps(manifest).encode()).hexdigest()[:10]
    (OUT / "sw.js").write_text(SW.replace("{version}", h), encoding="utf-8")
    print(f"App generada en {OUT} (versión {h})")


if __name__ == "__main__":
    main()
