/* ==========================================================
   MEMORYBOX SERVICE WORKER (SHARE TARGET + SAFE CACHING)
   - Receives native shares (POST /share-target)
   - Opens/app-focuses MemoryBox
   - Forwards shared File objects to the page via postMessage
========================================================== */

const CACHE_NAME = "memorybox-v7-publicurl";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/new_script.js",
  "/manifest.json",
  "/logo.svg",
];

/* ============================
   INSTALL
============================ */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
});

/* ============================
   ACTIVATE
============================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)),
        ),
      ),
  );
  self.clients.claim();
});

/* ============================
   FETCH
============================ */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ✅ SHARE TARGET (Other Apps → MemoryBox)
  if (req.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleShareTarget(req));
    return;
  }

  // Only cache GET
  if (req.method !== "GET") return;

  // Never touch unsupported schemes
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Cross-origin: just fetch (fallback to cache if any)
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Network-first for same-origin
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      })
      .catch(() => caches.match(req)),
  );
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const files = formData.getAll("media");

  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  // Prefer any existing client (visible first)
  let client =
    clientsList.find((c) => c.visibilityState === "visible") || clientsList[0];

  if (!client) {
    client = await self.clients.openWindow("/?source=pwa&share=1");
  } else {
    client.focus?.();
  }

  client?.postMessage({ type: "SHARED_FILES", files });

  return Response.redirect("/?source=pwa&share=1", 303);
}

/* ============================
   NOTIFICATIONS + PING
============================ */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification("MemoryBox", {
      body: event.data.message,
      icon: "/logo.svg",
      badge: "/logo.svg",
    });
  }

  if (event.data?.type === "PING") {
    if (event.ports && event.ports[0]) event.ports[0].postMessage("READY");
  }
});
